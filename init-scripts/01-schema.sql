-- ============================================================================
-- LandBiznes: National-Grade Land Registry System
-- Production-Ready Spatial Schema with PostGIS
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create main schema
CREATE SCHEMA IF NOT EXISTS land_registry;
SET search_path TO land_registry;

-- ============================================================================
-- OWNERS & STAKEHOLDERS
-- ============================================================================

CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  owner_type VARCHAR(50) NOT NULL, -- Individual, Company, Government, etc.
  registration_number VARCHAR(100),
  tax_id VARCHAR(100),
  address TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_owners_email ON owners(email);
CREATE INDEX idx_owners_tax_id ON owners(tax_id);
CREATE INDEX idx_owners_is_active ON owners(is_active);

-- ============================================================================
-- PROPERTIES & PARCELS
-- ============================================================================

CREATE TABLE property_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE land_use_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parcels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  parcel_id VARCHAR(100) NOT NULL UNIQUE,
  property_type_id UUID NOT NULL REFERENCES property_types(id),
  land_use_id UUID REFERENCES land_use_types(id),
  location_name VARCHAR(255),
  area_sqm NUMERIC(15, 2) NOT NULL,
  description TEXT,
  geometry GEOMETRY(Geometry, 4326),
  is_active BOOLEAN DEFAULT true,
  is_disputed BOOLEAN DEFAULT false
);

CREATE INDEX idx_parcels_parcel_id ON parcels(parcel_id);
CREATE INDEX idx_parcels_property_type ON parcels(property_type_id);
CREATE INDEX idx_parcels_land_use ON parcels(land_use_id);
CREATE INDEX idx_parcels_is_active ON parcels(is_active);
CREATE INDEX idx_parcels_is_disputed ON parcels(is_disputed);
CREATE INDEX idx_parcels_geometry ON parcels USING GIST(geometry);

-- ============================================================================
-- OWNERSHIP RECORDS
-- ============================================================================

CREATE TABLE ownership_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  parcel_id UUID NOT NULL REFERENCES parcels(id),
  owner_id UUID NOT NULL REFERENCES owners(id),
  ownership_percentage NUMERIC(5, 2) NOT NULL CHECK (ownership_percentage > 0 AND ownership_percentage <= 100),
  ownership_type VARCHAR(50) NOT NULL, -- Joint, Sole, Partnership, etc.
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT true,
  notes TEXT
);

CREATE INDEX idx_ownership_parcel ON ownership_records(parcel_id);
CREATE INDEX idx_ownership_owner ON ownership_records(owner_id);
CREATE INDEX idx_ownership_is_current ON ownership_records(is_current);
CREATE UNIQUE INDEX idx_ownership_current ON ownership_records(parcel_id, owner_id) WHERE is_current = true;

-- ============================================================================
-- TRANSACTIONS & DEEDS
-- ============================================================================

CREATE TABLE transaction_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  transaction_type_id UUID NOT NULL REFERENCES transaction_types(id),
  parcel_id UUID NOT NULL REFERENCES parcels(id),
  from_owner_id UUID REFERENCES owners(id),
  to_owner_id UUID REFERENCES owners(id),
  transaction_date DATE NOT NULL,
  value NUMERIC(15, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  reference_number VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  status VARCHAR(50) DEFAULT 'completed', -- pending, completed, disputed, cancelled
  recorded_by VARCHAR(255),
  attachment_url TEXT
);

CREATE INDEX idx_transactions_parcel ON transactions(parcel_id);
CREATE INDEX idx_transactions_from_owner ON transactions(from_owner_id);
CREATE INDEX idx_transactions_to_owner ON transactions(to_owner_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_ref ON transactions(reference_number);

-- ============================================================================
-- RIGHTS & RESTRICTIONS
-- ============================================================================

CREATE TABLE rights_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parcel_rights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  parcel_id UUID NOT NULL REFERENCES parcels(id),
  rights_type_id UUID NOT NULL REFERENCES rights_types(id),
  holder_id UUID NOT NULL REFERENCES owners(id),
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT
);

CREATE INDEX idx_parcel_rights_parcel ON parcel_rights(parcel_id);
CREATE INDEX idx_parcel_rights_holder ON parcel_rights(holder_id);

CREATE TABLE restriction_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parcel_restrictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  parcel_id UUID NOT NULL REFERENCES parcels(id),
  restriction_type_id UUID NOT NULL REFERENCES restriction_types(id),
  start_date DATE NOT NULL,
  end_date DATE,
  imposed_by VARCHAR(255),
  reason TEXT,
  severity VARCHAR(50) -- Minor, Medium, Major
);

CREATE INDEX idx_parcel_restrictions_parcel ON parcel_restrictions(parcel_id);

-- ============================================================================
-- DISPUTES & CONFLICTS
-- ============================================================================

CREATE TABLE dispute_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  parcel_id UUID NOT NULL REFERENCES parcels(id),
  claimant_id UUID NOT NULL REFERENCES owners(id),
  respondent_id UUID NOT NULL REFERENCES owners(id),
  dispute_status_id UUID NOT NULL REFERENCES dispute_statuses(id),
  description TEXT NOT NULL,
  evidence TEXT,
  resolution TEXT,
  filed_date DATE NOT NULL,
  resolved_date DATE,
  notes TEXT
);

CREATE INDEX idx_disputes_parcel ON disputes(parcel_id);
CREATE INDEX idx_disputes_claimant ON disputes(claimant_id);
CREATE INDEX idx_disputes_respondent ON disputes(respondent_id);
CREATE INDEX idx_disputes_status ON disputes(dispute_status_id);

-- ============================================================================
-- SURVEYS & MEASUREMENTS
-- ============================================================================

CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  parcel_id UUID NOT NULL REFERENCES parcels(id),
  survey_date DATE NOT NULL,
  surveyor_name VARCHAR(255) NOT NULL,
  surveyor_license VARCHAR(100),
  area_sqm NUMERIC(15, 2) NOT NULL,
  boundary_points GEOMETRY(Polygon, 4326),
  coordinates_json JSONB,
  certification_status VARCHAR(50) DEFAULT 'pending', -- pending, certified, rejected
  notes TEXT,
  attachment_url TEXT
);

CREATE INDEX idx_surveys_parcel ON surveys(parcel_id);
CREATE INDEX idx_surveys_date ON surveys(survey_date);
CREATE INDEX idx_surveys_certification ON surveys(certification_status);

-- ============================================================================
-- DOCUMENTS & REGISTRATIONS
-- ============================================================================

CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  parcel_id UUID REFERENCES parcels(id),
  owner_id UUID REFERENCES owners(id),
  document_number VARCHAR(100),
  issue_date DATE NOT NULL,
  expiry_date DATE,
  file_path TEXT,
  file_url TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, expired, revoked, archived
  verified_by VARCHAR(255),
  verified_date TIMESTAMP
);

CREATE INDEX idx_documents_parcel ON documents(parcel_id);
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_type ON documents(document_type_id);
CREATE INDEX idx_documents_status ON documents(status);

-- ============================================================================
-- AUDIT & COMPLIANCE
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_audit_created ON audit_logs(created_at);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_table ON audit_logs(table_name);

-- ============================================================================
-- NOTIFICATIONS & ALERTS
-- ============================================================================

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES owners(id),
  notification_type VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  owner_id UUID NOT NULL REFERENCES owners(id),
  notification_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  data JSONB
);

CREATE INDEX idx_notifications_owner ON notifications(owner_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO property_types (code, name, description) VALUES
('LAND', 'Land', 'Agricultural or raw land'),
('RESIDENTIAL', 'Residential', 'Residential property'),
('COMMERCIAL', 'Commercial', 'Commercial property'),
('INDUSTRIAL', 'Industrial', 'Industrial property'),
('MIXED', 'Mixed Use', 'Mixed-use property');

INSERT INTO land_use_types (code, name, description) VALUES
('AGRICULTURAL', 'Agricultural', 'Used for farming or agriculture'),
('RESIDENTIAL', 'Residential', 'Used for residential purposes'),
('COMMERCIAL', 'Commercial', 'Used for commercial purposes'),
('INDUSTRIAL', 'Industrial', 'Used for industrial purposes'),
('CONSERVATION', 'Conservation', 'Protected conservation area'),
('GOVERNMENT', 'Government', 'Government-owned land'),
('VACANT', 'Vacant', 'Vacant/undeveloped land');

INSERT INTO transaction_types (code, name, description) VALUES
('SALE', 'Sale', 'Property sale transaction'),
('TRANSFER', 'Transfer', 'Property transfer without sale'),
('LEASE', 'Lease', 'Property lease agreement'),
('MORTGAGE', 'Mortgage', 'Property mortgage'),
('INHERITANCE', 'Inheritance', 'Property inheritance'),
('DONATION', 'Donation', 'Property donation'),
('CONFISCATION', 'Confiscation', 'Government confiscation');

INSERT INTO rights_types (code, name, description) VALUES
('OWNERSHIP', 'Ownership', 'Full ownership right'),
('USUFRUCT', 'Usufruct', 'Right to use and enjoy property'),
('SERVITUDE', 'Servitude', 'Right to use another person\'s property'),
('MORTGAGE', 'Mortgage', 'Mortgage right'),
('EASEMENT', 'Easement', 'Right to pass through or use land');

INSERT INTO restriction_types (code, name, description) VALUES
('ENVIRONMENTAL', 'Environmental', 'Environmental protection restriction'),
('ARCHEOLOGICAL', 'Archeological', 'Archeological protection restriction'),
('HERITAGE', 'Heritage', 'Cultural heritage restriction'),
('UTILITY', 'Utility', 'Utility corridor restriction'),
('MORTGAGE', 'Mortgage', 'Mortgage lien restriction'),
('LEGAL', 'Legal', 'Legal restriction (court order)'),
('TAX', 'Tax', 'Tax lien restriction');

INSERT INTO dispute_statuses (code, name) VALUES
('OPEN', 'Open'),
('PENDING_REVIEW', 'Pending Review'),
('UNDER_MEDIATION', 'Under Mediation'),
('IN_LITIGATION', 'In Litigation'),
('RESOLVED', 'Resolved'),
('WITHDRAWN', 'Withdrawn'),
('DISMISSED', 'Dismissed');

INSERT INTO document_types (code, name, description) VALUES
('TITLE_DEED', 'Title Deed', 'Property title deed'),
('SURVEY_REPORT', 'Survey Report', 'Land survey report'),
('OWNERSHIP_CERT', 'Ownership Certificate', 'Certificate of ownership'),
('TRANSFER_DOC', 'Transfer Document', 'Property transfer document'),
('LEASE_AGREEMENT', 'Lease Agreement', 'Lease agreement document'),
('MORTGAGE_DEED', 'Mortgage Deed', 'Mortgage deed'),
('TAX_CLEARANCE', 'Tax Clearance', 'Tax clearance certificate');

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE VIEW current_ownership AS
SELECT 
  p.id as parcel_id,
  p.parcel_id,
  p.location_name,
  p.area_sqm,
  o.id as owner_id,
  o.name as owner_name,
  o.email,
  or.ownership_percentage,
  or.ownership_type,
  pt.name as property_type,
  lut.name as land_use
FROM parcels p
JOIN ownership_records or ON p.id = or.parcel_id
JOIN owners o ON or.owner_id = o.id
JOIN property_types pt ON p.property_type_id = pt.id
LEFT JOIN land_use_types lut ON p.land_use_id = lut.id
WHERE or.is_current = true AND p.is_active = true;

CREATE VIEW disputed_parcels AS
SELECT DISTINCT
  p.id,
  p.parcel_id,
  p.location_name,
  COUNT(d.id) as dispute_count,
  STRING_AGG(DISTINCT d.description, '; ') as dispute_descriptions
FROM parcels p
LEFT JOIN disputes d ON p.id = d.parcel_id
WHERE p.is_disputed = true
GROUP BY p.id, p.parcel_id, p.location_name;

CREATE VIEW owner_portfolio AS
SELECT 
  o.id,
  o.name,
  o.owner_type,
  COUNT(DISTINCT p.id) as parcel_count,
  SUM(p.area_sqm) as total_area_sqm,
  STRING_AGG(DISTINCT pt.name, ', ') as property_types
FROM owners o
LEFT JOIN ownership_records or ON o.id = or.owner_id AND or.is_current = true
LEFT JOIN parcels p ON or.parcel_id = p.id AND p.is_active = true
LEFT JOIN property_types pt ON p.property_type_id = pt.id
WHERE o.is_active = true
GROUP BY o.id, o.name, o.owner_type;

-- ============================================================================
-- FUNCTIONS FOR AUDIT
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values)
  VALUES (
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for audit logging on key tables
CREATE TRIGGER parcels_audit AFTER INSERT OR UPDATE OR DELETE ON parcels
FOR EACH ROW EXECUTE FUNCTION audit_log();

CREATE TRIGGER ownership_records_audit AFTER INSERT OR UPDATE OR DELETE ON ownership_records
FOR EACH ROW EXECUTE FUNCTION audit_log();

CREATE TRIGGER transactions_audit AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION audit_log();

CREATE TRIGGER disputes_audit AFTER INSERT OR UPDATE OR DELETE ON disputes
FOR EACH ROW EXECUTE FUNCTION audit_log();
