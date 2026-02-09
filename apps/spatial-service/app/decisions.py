"""
Decision Logic & Event Classification

Given spatial analysis + lineage, produce regulatory decision.

Three-section output:
1. Classification (enum)
2. Decision (human-readable)
3. Justification (technical + regulatory)
"""

from dataclasses import dataclass
from enum import Enum
from parcel_identity import ParcelIdentity, EventType
from spatial_analysis import SpatialRelation, SpatialResult, analyze_spatial_relation


class DecisionType(Enum):
    """Allowed regulatory decisions"""
    LEGITIMATE_SUBDIVISION = "legitimate_subdivision"
    FRAUD_DETECTED = "fraud_detected"
    CONFLICT_REQUIRES_OARG = "conflict_requires_oarg"
    OVERLAP_UNAUTHORIZED = "overlap_unauthorized"
    PARCEL_OK = "parcel_ok"


@dataclass
class Decision:
    """
    Three-section regulatory decision.
    
    1. classification: DecisionType (enum)
    2. decision_text: Plain English explanation
    3. justification: Technical + regulatory reasoning
    """
    
    parcel_id: str
    related_parcel_id: str
    classification: DecisionType
    decision_text: str
    justification: str
    spatial_relation: str
    overlap_pct: float
    
    def __repr__(self):
        return f"""
================================
SPATIAL DECISION
================================

1. CLASSIFICATION
   {self.classification.value}

2. DECISION
   {self.decision_text}

3. JUSTIFICATION
   {self.justification}

DETAILS:
   Parcel: {self.parcel_id}
   Related: {self.related_parcel_id}
   Relation: {self.spatial_relation}
   Overlap: {self.overlap_pct:.1f}%
================================
"""


def classify_relation(
    subject: ParcelIdentity,
    other: ParcelIdentity,
    spatial_result: SpatialResult
) -> Decision:
    """
    Classify spatial relationship as regulatory decision.
    
    Input: Two parcels + spatial analysis
    Output: Three-section decision (classification, decision, justification)
    """
    
    relation = spatial_result.relation
    overlap_pct = spatial_result.overlap_pct_a
    
    # ========== IDENTICAL GEOMETRY ==========
    if relation == SpatialRelation.IDENTICAL:
        return Decision(
            parcel_id=subject.parcel_id,
            related_parcel_id=other.parcel_id,
            classification=DecisionType.FRAUD_DETECTED,
            decision_text=(
                f"FRAUD: Parcel {subject.parcel_id} has identical geometry to {other.parcel_id}. "
                f"Two parcels cannot claim the same land. OARG must determine which registration is valid."
            ),
            justification=(
                f"Spatial test: geometry is identical (100% overlap). "
                f"Subject: {subject.parcel_id} (area={subject.area_sqm:.0f}sqm). "
                f"Other: {other.parcel_id} (area={other.area_sqm:.0f}sqm). "
                f"Lineage: subject.parent={subject.parent_id}, other.parent={other.parent_id}. "
                f"Grid rule: both registered to grid {subject.grid_ref.key()}. "
                f"Verdict: Duplicate registration or fraudulent claim. Requires OARG intervention."
            ),
            spatial_relation=relation.value,
            overlap_pct=100.0
        )
    
    # ========== LEGITIMATE SUBDIVISION ==========
    if relation == SpatialRelation.CONTAINED and subject.parent_id == other.parcel_id:
        return Decision(
            parcel_id=subject.parcel_id,
            related_parcel_id=other.parcel_id,
            classification=DecisionType.LEGITIMATE_SUBDIVISION,
            decision_text=(
                f"APPROVED: Parcel {subject.parcel_id} is a legitimate child of {other.parcel_id}. "
                f"Geometry is fully contained within parent. Lineage verified. "
                f"Parent remains intact. This is a valid subdivision."
            ),
            justification=(
                f"Spatial test: {subject.parcel_id} contained in {other.parcel_id} "
                f"({overlap_pct:.1f}% overlap). "
                f"Lineage test: parent_id link verified. "
                f"Grid rule: first vertex of child determines grid {subject.grid_ref.key()}. "
                f"Parent integrity: geometry unchanged, only child reference added. "
                f"Verdict: Valid subdivision. No property law violation."
            ),
            spatial_relation=relation.value,
            overlap_pct=overlap_pct
        )
    
    # ========== CONTAINED WITHOUT LINEAGE (ORPHAN) ==========
    if relation == SpatialRelation.CONTAINED and subject.parent_id != other.parcel_id:
        return Decision(
            parcel_id=subject.parcel_id,
            related_parcel_id=other.parcel_id,
            classification=DecisionType.FRAUD_DETECTED,
            decision_text=(
                f"FRAUD: Parcel {subject.parcel_id} is spatially contained within {other.parcel_id}, "
                f"but NO lineage link exists. This is an orphan parcel—either invalid or fraudulent."
            ),
            justification=(
                f"Spatial test: {subject.parcel_id} fully contained in {other.parcel_id}. "
                f"Lineage test: NO parent_lineage link to {other.parcel_id}. "
                f"Subject parent_id: {subject.parent_id}. "
                f"Grid rule: containment alone is insufficient; formal subdivision creates lineage. "
                f"Verdict: Fraudulent or erroneous containment. Flag for OARG investigation."
            ),
            spatial_relation=relation.value,
            overlap_pct=overlap_pct
        )
    
    # ========== PARTIAL OVERLAP ==========
    if relation == SpatialRelation.OVERLAP:
        return Decision(
            parcel_id=subject.parcel_id,
            related_parcel_id=other.parcel_id,
            classification=DecisionType.CONFLICT_REQUIRES_OARG,
            decision_text=(
                f"AMBIGUOUS: Parcels {subject.parcel_id} and {other.parcel_id} have a "
                f"partial overlap ({overlap_pct:.1f}%). The overlapping area cannot be "
                f"owned by both parties. OARG officer must resolve boundary and determine "
                f"rightful owner of overlap."
            ),
            justification=(
                f"Spatial test: partial overlap, {overlap_pct:.1f}% of {subject.parcel_id}. "
                f"Lineage: no formal parent-child relationship. "
                f"Geometric analysis: neither contains nor is identical. "
                f"Regulatory: no automated rule can resolve overlapping ownership. "
                f"Verdict: Requires OARG judgment. Human officer must verify boundary survey and determine title."
            ),
            spatial_relation=relation.value,
            overlap_pct=overlap_pct
        )
    
    # ========== SUBJECT CONTAINS OTHER ==========
    if relation == SpatialRelation.CONTAINS:
        if other.parent_id == subject.parcel_id:
            return Decision(
                parcel_id=subject.parcel_id,
                related_parcel_id=other.parcel_id,
                classification=DecisionType.LEGITIMATE_SUBDIVISION,
                decision_text=(
                    f"APPROVED: Parcel {subject.parcel_id} is parent; it correctly contains "
                    f"child {other.parcel_id}. Parent geometry unchanged. Children registered as "
                    f"separate parcels with lineage links. Valid subdivision."
                ),
                justification=(
                    f"Spatial test: {subject.parcel_id} contains {other.parcel_id}. "
                    f"Lineage: other.parent_id = {subject.parcel_id} (verified). "
                    f"Parent integrity: geometry immutable, metadata updated only with child reference. "
                    f"Grid rule: each parcel has deterministic reference grid from first vertex. "
                    f"Verdict: Valid parent-child subdivision structure."
                ),
                spatial_relation=relation.value,
                overlap_pct=100.0
            )
        else:
            return Decision(
                parcel_id=subject.parcel_id,
                related_parcel_id=other.parcel_id,
                classification=DecisionType.CONFLICT_REQUIRES_OARG,
                decision_text=(
                    f"AMBIGUOUS: Parcel {subject.parcel_id} contains {other.parcel_id}, "
                    f"but no formal parent-child lineage exists. OARG must clarify whether "
                    f"this represents an unregistered subdivision or overlapping claims."
                ),
                justification=(
                    f"Spatial test: containment detected. "
                    f"Lineage: other.parent_id points to {other.parent_id}, not {subject.parcel_id}. "
                    f"Grid rule: formal subdivision requires explicit lineage. "
                    f"Verdict: Ambiguous containment. Requires OARG review and boundary clarification."
                ),
                spatial_relation=relation.value,
                overlap_pct=100.0
            )
    
    # ========== DISJOINT (NO CONFLICT) ==========
    if relation == SpatialRelation.DISJOINT:
        return Decision(
            parcel_id=subject.parcel_id,
            related_parcel_id=other.parcel_id,
            classification=DecisionType.PARCEL_OK,
            decision_text=(
                f"OK: Parcels {subject.parcel_id} and {other.parcel_id} do not overlap. "
                f"No spatial conflict."
            ),
            justification=(
                f"Spatial test: disjoint (no intersection). No geometric conflict."
            ),
            spatial_relation=relation.value,
            overlap_pct=0.0
        )
    
    # ========== DEFAULT (UNCERTAIN) ==========
    return Decision(
        parcel_id=subject.parcel_id,
        related_parcel_id=other.parcel_id,
        classification=DecisionType.CONFLICT_REQUIRES_OARG,
        decision_text=(
            f"UNCERTAIN: Could not automatically classify relationship between "
            f"{subject.parcel_id} and {other.parcel_id}. OARG review required."
        ),
        justification=(
            f"Spatial analysis inconclusive. Relation: {relation.value}. "
            f"Recommend manual OARG review."
        ),
        spatial_relation=relation.value,
        overlap_pct=overlap_pct
    )
