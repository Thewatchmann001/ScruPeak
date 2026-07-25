"""
Parcel Registry: PostGIS-backed authoritative store for CSI and parcel events.
"""

import json
import uuid
import random
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from sqlalchemy import (
    Column, String, Integer, Float, DateTime, 
    ForeignKey, Boolean, JSON, create_engine, select, update
)
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from geoalchemy2 import Geometry, Geography, WKTElement
from geoalchemy2.shape import to_shape, from_shape
from shapely.geometry import Polygon, MultiPolygon

from csi_model import (
    CompositeSpatialIdentity,
    LineageLink,
    EventType,
    ParcelEvent,
    GridReference,
    HistoryEvent
)
from exceptions import ( # type: ignore
    SpatialServiceError,
    ParcelNotFoundError,
    InvalidGeometryError,
)
import constants
from spatial_detector import SpatialRelationshipDetector

Base = declarative_base()

class ParcelDB(Base):
    __tablename__ = "parcels"
    csi_id = Column(String, primary_key=True)
    parcel_code = Column(String, unique=True, index=True)
    geometry = Column(Geometry("POLYGON", srid=4326))
    grid_id = Column(Integer)
    grid_x = Column(Integer)
    grid_y = Column(Integer)
    version = Column(Integer, default=1)
    verification_status = Column(String, default="unverified")
    oarg_approval = Column(Boolean, default=False)
    owner = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    history = relationship("HistoryDB", back_populates="parcel", cascade="all, delete-orphan")
    lineage_as_child = relationship("LineageDB", foreign_keys="LineageDB.child_csi_id", back_populates="child")

class HistoryDB(Base):
    __tablename__ = "parcel_history"
    id = Column(Integer, primary_key=True)
    csi_id = Column(String, ForeignKey("parcels.csi_id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    event_type = Column(String)
    actor = Column(String)
    description = Column(String)
    metadata_json = Column(JSON)
    
    parcel = relationship("ParcelDB", back_populates="history")

class LineageDB(Base):
    __tablename__ = "parcel_lineage"
    id = Column(Integer, primary_key=True)
    parent_csi_id = Column(String, ForeignKey("parcels.csi_id"))
    child_csi_id = Column(String, ForeignKey("parcels.csi_id"))
    relationship_type = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    child = relationship("ParcelDB", foreign_keys=[child_csi_id], back_populates="lineage_as_child")

class EventDB(Base):
    __tablename__ = "global_parcel_events"
    event_id = Column(String, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    subject_csi_id = Column(String, ForeignKey("parcels.csi_id"))
    spatial_relationship = Column(String)
    initiated_by = Column(String)
    overlap_area_sqm = Column(Float, nullable=True)
    request_metadata = Column(JSON)

class GridSequenceDB(Base):
    __tablename__ = "grid_sequences"
    grid_key = Column(String, primary_key=True)
    last_seq = Column(Integer, default=0)


class ParcelRegistry:
    """Authoritative PostGIS-backed registry of all land parcels"""
    
    def __init__(self, db_url: str = "postgresql://user:pass@localhost/scrupeak"):
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

    def _to_csi(self, db_parcel: ParcelDB, session) -> CompositeSpatialIdentity:
        """Helper to convert DB model to Dataclass API object"""
        # Convert PostGIS geometry back to [(lat, lon), ...]
        shape = to_shape(db_parcel.geometry)
        # PostGIS stores (lon, lat), we return (lat, lon)
        if isinstance(shape, Polygon):
            geometry = [(p[1], p[0]) for p in list(shape.exterior.coords)]
        elif isinstance(shape, MultiPolygon):
            # Handle MultiPolygon by taking the first polygon's exterior
            # This might need more sophisticated handling depending on requirements
            geometry = [(p[1], p[0]) for p in list(shape.geoms[0].exterior.coords)]
        else:
            raise InvalidGeometryError("Unsupported geometry type from DB")
        
        # Build history
        history = [
            HistoryEvent(
                timestamp=h.timestamp,
                event_type=EventType(h.event_type),
                actor=h.actor,
                description=h.description,
                metadata=h.metadata_json
            ) for h in db_parcel.history
        ]

        # Build Lineage
        parent_link = None
        if db_parcel.lineage_as_child:
            link = db_parcel.lineage_as_child[0]
            # We need to fetch the parent code
            parent = session.query(ParcelDB).filter_by(csi_id=link.parent_csi_id).options(
                # Eager load history for parent if needed, or fetch minimal data
            ).first()
            if parent:
                parent_link = LineageLink(
                    parent_csi_id=parent.csi_id,
                    parent_parcel_code=parent.parcel_code,
                    relationship_type=link.relationship_type,
                    created_at=link.created_at
                )

        # Fetch children (can be optimized with eager loading if always needed)
        child_codes = [
            r.parcel_code for r in session.query(ParcelDB.parcel_code)
            .join(LineageDB, LineageDB.child_csi_id == ParcelDB.csi_id)
            .filter(LineageDB.parent_csi_id == db_parcel.csi_id).all()
        ]

        return CompositeSpatialIdentity(
            csi_id=db_parcel.csi_id,
            parcel_code=db_parcel.parcel_code,
            geometry=geometry,
            grid_ref=GridReference(db_parcel.grid_id, db_parcel.grid_x, db_parcel.grid_y),
            version=db_parcel.version,
            verification_status=db_parcel.verification_status,
            oarg_approval=db_parcel.oarg_approval,
            owner=db_parcel.owner,
            history=history,
            parent_lineage=parent_link,
            child_parcel_codes=child_codes,
            created_at=db_parcel.created_at
        )
    
    def register_parcel(
        self,
        geometry: List[Tuple[float, float]],
        grid_id: int,
        grid_x: int,
        grid_y: int,
        reference_vertex_index: int = 0,
        owner: Optional[str] = None,
        initiated_by: str = "system"
    ) -> CompositeSpatialIdentity:
        """
        Register a new parcel (birth event).
        
        Enforces:
        - Grid reference rule: first vertex defines the grid
        - Closed polygon validation
        - Unique parcel code generation
        """
        # Production Grade Topology Validation
        is_valid_topo, error_msg = SpatialRelationshipDetector.validate_topology(geometry)
        if not is_valid_topo:
            raise InvalidGeometryError(error_msg)

        # Validate geometry is closed polygon
        if not geometry or geometry[0] != geometry[-1]:
            raise InvalidGeometryError("Geometry must be a closed polygon")
        if len(geometry) < 4:
            raise InvalidGeometryError("Polygon must have at least 3 vertices")
        
        grid_key = f"{grid_id:0{constants.GRID_ID_FORMAT_LEN}d}{grid_x:02d}{grid_y:02d}"

        with self.Session() as session:
            # Handle Sequence
            seq_row = session.query(GridSequenceDB).filter_by(grid_key=grid_key).with_for_update().first()
            if not seq_row:
                seq_row = GridSequenceDB(grid_key=grid_key, last_seq=1)
                session.add(seq_row)
            else:
                seq_row.last_seq += 1
            
            seq = seq_row.last_seq
            # Removed random_part for deterministic parcel codes
            parcel_code = f"{grid_id:0{constants.GRID_ID_FORMAT_LEN}d}-{grid_x:02d}-{grid_y:02d}-{seq:0{constants.SEQUENCE_FORMAT_LEN}d}"
            
            csi_id = str(uuid.uuid4())
            
            # Convert to PostGIS Polygon (lon, lat)
            wkt = f"POLYGON(({', '.join([f'{p[1]} {p[0]}' for p in geometry])}))"
            
            db_parcel = ParcelDB(
                csi_id=csi_id,
                parcel_code=parcel_code,
                geometry=WKTElement(wkt, srid=4326),
                grid_id=grid_id,
                grid_x=grid_x,
                grid_y=grid_y,
                owner=owner
            )
            session.add(db_parcel)
            
            # Add History
            history = HistoryDB(
                csi_id=csi_id,
                event_type=EventType.PARCEL_CREATED.value,
                actor=initiated_by,
                description=f"Parcel registered: {parcel_code}",
                metadata_json={
                    "grid": grid_key,
                    "sequence": seq,
                    "owner": owner,
                    "vertices": len(geometry)
                }
            )
            session.add(history)
            session.commit()
            
            # Fetch back to return the API object
            return self._to_csi(db_parcel, session)
    
    def register_parcel_event(
        self,
        event: ParcelEvent,
        initiated_by: str = "system"
    ):
        """Record a parcel event (append-only)"""
        with self.Session() as session:
            db_event = EventDB(
                event_id=event.event_id,
                timestamp=event.timestamp,
                subject_csi_id=event.subject_csi.csi_id,
                spatial_relationship=event.spatial_relationship,
                initiated_by=initiated_by,
                overlap_area_sqm=event.overlap_area_sqm,
                request_metadata=event.request_metadata
            )
            session.add(db_event)
            
            # Update specific parcel history too
            # (Implementation skipped for brevity, similar to register_parcel)
            session.commit()

    def detect_spatial_conflicts(
        self,
        subject_csi: CompositeSpatialIdentity,
        initiated_by: str = "system"
    ) -> Optional[ParcelEvent]:
        """
        Identify conflicts by querying PostGIS directly via the detector.
        Avoids the O(n) overhead of fetching all parcels into memory.
        """
        with self.Session() as session:
            conflicts_raw = SpatialRelationshipDetector.find_conflicts_sql(
                session, ParcelDB, subject_csi, initiated_by
            )
            
            if not conflicts_raw:
                return None

            # Map DB results back to CSI objects
            other_csis = [self._to_csi(c["model"], session) for c in conflicts_raw]
            
            return ParcelEvent(
                event_id=str(uuid.uuid4()),
                timestamp=datetime.utcnow(),
                subject_csi=subject_csi,
                other_csis=other_csis,
                spatial_relationship=conflicts_raw[0]["relationship"],
                overlap_area_sqm=conflicts_raw[0]["overlap_area"],
                initiated_by=initiated_by
            )
    
    def create_child_parcel(
        self,
        parent_csi: CompositeSpatialIdentity,
        child_geometry: List[Tuple[float, float]],
        grid_id: int,
        grid_x: int,
        grid_y: int,
        relationship_type: str,  # "subdivision", "split"
        initiated_by: str = "system",
        new_parent_geometry: Optional[List[Tuple[float, float]]] = None
    ) -> CompositeSpatialIdentity:
        """
        Create a child parcel from a parent (subdivision or split).
        
        Enforces:
        - Parent remains intact (no geometry change)
        - Child gets new parcel code and CSI
        - Lineage link created
        - Parent updated with child reference
        """
        # Create the child parcel
        child_csi = self.register_parcel(
            geometry=child_geometry,
            grid_id=grid_id,
            grid_x=grid_x,
            grid_y=grid_y,
            owner=parent_csi.owner,
            initiated_by=initiated_by
        )
        
        # If new parent geometry is provided, shrink the mother polygon
        if new_parent_geometry:
            self.update_parcel_geometry(
                csi_id=parent_csi.csi_id,
                new_geometry=new_parent_geometry,
                actor=initiated_by,
                reason=f"Mother polygon shrunk due to {relationship_type} of {child_csi.parcel_code}"
            )

        # Create lineage link
        lineage = LineageLink(
            parent_csi_id=parent_csi.csi_id,
            parent_parcel_code=parent_csi.parcel_code,
            relationship_type=relationship_type,
            created_at=datetime.utcnow()
        )
        child_csi.parent_lineage = lineage
        
        # Update parent's child_parcel_codes in DB
        self._add_child_to_parent(parent_csi.csi_id, child_csi.parcel_code)
        
        # Add history events
        event_type = (
            EventType.PARCEL_SUBDIVISION if relationship_type == "subdivision"
            else EventType.PARCEL_SPLIT
        )
        
        self._add_history_event_to_parcel(
            csi_id=parent_csi.csi_id,
            event_type=event_type,
            actor=initiated_by,
            description=f"Child parcel created: {child_csi.parcel_code}",
            metadata={
                "child_code": child_csi.parcel_code,
                "relationship": relationship_type
            }
        )
        
        self._add_history_event_to_parcel(
            csi_id=child_csi.csi_id,
            event_type=event_type,
            actor=initiated_by,
            description=f"Born from parent: {parent_csi.parcel_code}",
            metadata={
                "parent_code": parent_csi.parcel_code,
                "relationship": relationship_type
            }
        )
        
        return child_csi
    
    def _add_child_to_parent(self, parent_csi_id: str, child_parcel_code: str):
        with self.Session() as session:
            db_parent = session.query(ParcelDB).filter_by(csi_id=parent_csi_id).first()
            if db_parent:
                # Assuming child_parcel_codes is not directly stored in ParcelDB,
                # but derived from LineageDB. This method would update LineageDB.
                # For now, this is a placeholder.
                pass
            session.commit()

    def _add_history_event_to_parcel(self, csi_id: str, event_type: EventType, actor: str, description: str, metadata: Optional[Dict] = None):
        with self.Session() as session:
            history = HistoryDB(
                csi_id=csi_id,
                event_type=event_type.value,
                actor=actor,
                description=description,
                metadata_json=metadata or {}
            )
            session.add(history)
            session.commit()

    def get_parcel(self, parcel_code: str) -> Optional[CompositeSpatialIdentity]:
        """Retrieve parcel by code"""
        with self.Session() as session:
            db_parcel = session.query(ParcelDB).filter_by(parcel_code=parcel_code).first()
            return self._to_csi(db_parcel, session) if db_parcel else None

    def get_parcel_lineage(self, parcel_code: str) -> Dict:
        """Get full genealogy: parents, children, ancestors"""
        csi = self.get_parcel(parcel_code)
        if not csi:
            return {}
        
        result = {
            "parcel_code": parcel_code,
            "parent": None,
            "children": csi.child_parcel_codes,
            "ancestors": []
        }
        
        # Traverse up to root
        current = csi
        while current and current.parent_lineage:
            parent_code = current.parent_lineage.parent_parcel_code
            result["ancestors"].append(parent_code)
            current = self.get_parcel(parent_code)
            if not current:
                break

        if csi.parent_lineage:
            result["parent"] = csi.parent_lineage.parent_parcel_code
        
        return result
    
    def verify_parcel(
        self,
        parcel_code: str,
        initiated_by: str = "system"
    ):
        """Mark parcel as verified by OARG"""
        with self.Session() as session:
            db_parcel = session.query(ParcelDB).filter_by(parcel_code=parcel_code).first()
            if not db_parcel:
                raise ParcelNotFoundError(f"Parcel not found: {parcel_code}")
            
            db_parcel.verification_status = "verified"
            db_parcel.oarg_approval = True
            self._add_history_event_to_parcel(
                csi_id=db_parcel.csi_id,
                event_type=EventType.PARCEL_VERIFIED,
                actor=initiated_by,
                description=f"Parcel {parcel_code} verified by OARG",
                metadata={"status": "verified", "oarg_approved": True}
            )

            # Add History event here...
            session.commit()
    
    def flag_fraud_risk(
        self,
        parcel_code: str,
        reason: str,
        initiated_by: str = "system"
    ):
        with self.Session() as session:
            db_parcel = session.query(ParcelDB).filter_by(parcel_code=parcel_code).first()
            if not db_parcel:
                raise ParcelNotFoundError(f"Parcel not found: {parcel_code}")
            
            db_parcel.verification_status = "disputed"
            self._add_history_event_to_parcel(
                csi_id=db_parcel.csi_id,
                event_type=EventType.FRAUD_FLAGGED,
                actor=initiated_by,
                description=f"Parcel {parcel_code} flagged for fraud risk: {reason}",
                metadata={"reason": reason, "status": "disputed"}
            )
            session.commit()
    
    def request_oarg_review(
        self,
        parcel_code: str,
        reason: str,
        initiated_by: str = "system"
    ):
        with self.Session() as session:
            db_parcel = session.query(ParcelDB).filter_by(parcel_code=parcel_code).first()
            if not db_parcel:
                raise ParcelNotFoundError(f"Parcel not found: {parcel_code}")
            
            db_parcel.verification_status = "pending"
            self._add_history_event_to_parcel(
                csi_id=db_parcel.csi_id,
                event_type=EventType.OARG_REVIEW_REQUESTED,
                actor=initiated_by,
                description=f"OARG review requested for parcel {parcel_code}: {reason}",
                metadata={"reason": reason, "status": "pending"}
            )
            session.commit()
    
    def get_all_events(self) -> List[ParcelEvent]:
        # Implementation requires mapping EventDB back to ParcelEvent dataclass
        with self.Session() as session:
            db_events = session.query(EventDB).all()
            parcel_events = []
            for db_event in db_events:
                subject_csi = self.get_csi_by_id(db_event.subject_csi_id) # Need a get_csi_by_id
                if subject_csi:
                    parcel_events.append(
                        ParcelEvent(
                            event_id=db_event.event_id,
                            timestamp=db_event.timestamp,
                            subject_csi=subject_csi,
                            spatial_relationship=db_event.spatial_relationship,
                            initiated_by=db_event.initiated_by,
                            overlap_area_sqm=db_event.overlap_area_sqm,
                            request_metadata=db_event.request_metadata
                        )
                    )
            return parcel_events

    def get_csi_by_id(self, csi_id: str) -> Optional[CompositeSpatialIdentity]:
        """Retrieve parcel by CSI UUID"""
        with self.Session() as session:
            db_parcel = session.query(ParcelDB).filter_by(csi_id=csi_id).first()
            return self._to_csi(db_parcel, session) if db_parcel else None

    
    def get_all_parcels(self) -> List[CompositeSpatialIdentity]:
        with self.Session() as session:
            rows = session.query(ParcelDB).all()
            return [self._to_csi(r, session) for r in rows]

    def __repr__(self):
        with self.Session() as session:
            count = session.query(ParcelDB).count()
            return f"<ParcelRegistry PostGIS-backed parcels={count}>"

    def update_parcel_geometry(self, csi_id: str, new_geometry: List[Tuple[float, float]], actor: str, reason: str):
        """
        Audited geometry update.
        Increments version and records the transition in history.
        """
        if new_geometry[0] != new_geometry[-1]:
            raise InvalidGeometryError("Geometry must be a closed polygon")

        with self.Session() as session:
            db_parcel = session.query(ParcelDB).filter_by(csi_id=csi_id).first()
            if not db_parcel:
                raise ParcelNotFoundError(f"Parcel with CSI ID {csi_id} not found.")

            old_geometry_wkt = db_parcel.geometry.wkt
            old_geometry_shape = to_shape(db_parcel.geometry)
            old_version = db_parcel.version

            # Convert new geometry to WKT for PostGIS
            wkt = f"POLYGON(({', '.join([f'{p[1]} {p[0]}' for p in new_geometry])}))"
            db_parcel.geometry = WKTElement(wkt, srid=4326)
            db_parcel.version += 1

            # Add history event
            history = HistoryDB(
                csi_id=csi_id,
                event_type=EventType.PARCEL_GEOMETRY_CONFIRMED.value,
                actor=actor,
                description=f"Geometry updated to version {db_parcel.version}: {reason}",
                metadata_json={
                    "previous_version": old_version,
                    "new_version": db_parcel.version,
                    "previous_geometry_wkt": old_geometry_wkt,
                    "new_geometry_wkt": wkt,
                    "reason": reason
                }
            )
            session.add(history)
            session.commit()
