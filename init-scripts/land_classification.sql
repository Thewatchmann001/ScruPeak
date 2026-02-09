/* 
 * NATIONAL LAND CLASSIFICATION SYSTEM
 * -----------------------------------
 * Introduces a standardized, extensible reference table for land categories
 * and links it to the core parcel registry.
 * 
 * Execution: Run as a single block.
 */

-- 1. Create the classification reference table
CREATE TABLE IF NOT EXISTS land_classifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_state_land BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seed national classification categories
INSERT INTO land_classifications (code, name, description, is_state_land) VALUES
('STATE_GOV',   'Government/State Land',    'Land owned and managed directly by central or local government bodies.', true),
('RES_PVT',     'Residential/Personal',     'Land designated for private housing, personal dwellings, and domestic use.', false),
('COM_GEN',     'Commercial',               'Land designated for business, retail, office, hospitality, or trade purposes.', false),
('AGR_GEN',     'Agricultural',             'Land designated for farming, cultivation, livestock, or aquaculture.', false),
('IND_GEN',     'Industrial',               'Land designated for manufacturing, processing, warehousing, or heavy industry.', false),
('INS_REL',     'Religious/Institutional',  'Land held by religious bodies, educational institutions, or non-profits.', false),
('CUST_COM',    'Customary/Community',      'Land held under customary law, communal ownership, or tribal trust.', false),
('PROT_RES',    'Protected/Reserved',       'Conservation areas, national parks, forest reserves, or strategic zones.', true)
ON CONFLICT (code) DO NOTHING;

-- 3. Link parcels to classification (Additive Change)
-- Note: Column is nullable to support existing records without immediate migration
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'classification_id') THEN
        ALTER TABLE parcels 
        ADD COLUMN classification_id UUID REFERENCES land_classifications(id);
        
        -- Create index for performance on classification filtering
        CREATE INDEX idx_parcels_classification_id ON parcels(classification_id);
    END IF;
END $$;

-- 4. Documentation
COMMENT ON TABLE land_classifications IS 'Master reference registry for national land classification categories (e.g., State, Residential, Customary).';
COMMENT ON COLUMN land_classifications.code IS 'Immutable, human-readable code for the category (e.g., STATE_GOV). Used for system lookups.';
COMMENT ON COLUMN land_classifications.is_state_land IS 'Flag indicating if this category constitutes public/state ownership vs private/communal.';
COMMENT ON COLUMN parcels.classification_id IS 'Reference to the legal classification of the land. Null implies unclassified/pending.';