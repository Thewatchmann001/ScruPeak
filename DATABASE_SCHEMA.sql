-- LandBiznes Database Schema (PostgreSQL 15 + PostGIS)
-- Complete schema for land registry marketplace with blockchain integration

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== USERS TABLE ====================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('buyer', 'owner', 'agent', 'admin')),
    
    -- Profile information
    profile_photo_url TEXT,
    bio TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Verification status
    is_verified BOOLEAN DEFAULT FALSE,
    kyc_document_url TEXT,
    kyc_verified_at TIMESTAMP,
    verification_admin_id UUID REFERENCES users(id),
    
    -- Social
    telegram_id VARCHAR(100),
    twitter_handle VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    -- Indices
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_verified (is_verified),
    UNIQUE INDEX idx_phone (phone)
);

-- ==================== AGENTS TABLE ====================
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Agent verification
    ministry_registered BOOLEAN DEFAULT FALSE,
    ministry_registration_number VARCHAR(100),
    platform_verified BOOLEAN DEFAULT FALSE,
    verification_documents JSONB,  -- URLs to credentials
    
    -- Business info
    company_name VARCHAR(255),
    company_registration VARCHAR(100),
    office_address TEXT,
    office_phone VARCHAR(20),
    
    -- Performance metrics
    total_listings INT DEFAULT 0,
    successful_sales INT DEFAULT 0,
    avg_rating DECIMAL(3, 2),
    reviews_count INT DEFAULT 0,
    
    -- Blockchain
    wallet_address VARCHAR(100),  -- Solana address
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_user_id (user_id),
    INDEX idx_platform_verified (platform_verified)
);

-- ==================== LAND TABLE ====================
CREATE TABLE land (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location_name VARCHAR(255),
    size_sqm DECIMAL(12, 2) NOT NULL,  -- Square meters
    size_acres DECIMAL(12, 2),
    estimated_price DECIMAL(18, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Location (PostGIS)
    location GEOMETRY(POINT, 4326),
    boundary GEOMETRY(POLYGON, 4326),  -- Land boundary
    
    -- Status workflow
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (
        status IN ('draft', 'pending_verification', 'verified', 'listed', 'sold', 'delisted')
    ),
    
    -- Verification
    verified_by_admin_id UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    verification_notes TEXT,
    
    -- Blockchain
    blockchain_hash VARCHAR(255),  -- Document hash on Solana
    blockchain_tx VARCHAR(255),    -- Transaction signature
    blockchain_verified_at TIMESTAMP,
    
    -- Metadata
    features JSONB,  -- Amenities, water access, etc.
    media_urls JSONB,  -- Photos, videos
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    INDEX idx_owner_id (owner_id),
    INDEX idx_status (status),
    INDEX idx_verified_at (verified_at),
    INDEX idx_location_gist USING GIST (location),
    INDEX idx_boundary_gist USING GIST (boundary)
);

-- ==================== DOCUMENTS TABLE ====================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    land_id UUID NOT NULL REFERENCES land(id) ON DELETE CASCADE,
    uploaded_by_id UUID NOT NULL REFERENCES users(id),
    
    -- Document type
    document_type VARCHAR(50) NOT NULL CHECK (
        document_type IN ('survey_plan', 'chief_form', 'deed', 'title', 'lease', 'other')
    ),
    
    -- File info
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INT,
    file_hash VARCHAR(255),  -- SHA256 for integrity
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_by_admin_id UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    ai_fraud_score DECIMAL(3, 2),  -- 0.0 - 1.0 (1.0 = high fraud risk)
    ai_verification_notes TEXT,
    
    -- Blockchain
    blockchain_hash VARCHAR(255),  -- Hash stored on Solana
    blockchain_tx VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_land_id (land_id),
    INDEX idx_document_type (document_type),
    INDEX idx_verified (verified),
    UNIQUE INDEX idx_file_hash (file_hash)
);

-- ==================== ESCROW TABLE ====================
CREATE TABLE escrow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    land_id UUID NOT NULL REFERENCES land(id),
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    
    -- Payment info
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(10, 4),  -- If paying in different currency
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'deposit_received', 'under_review', 'approved', 'released', 'refunded', 'disputed')
    ),
    
    -- Blockchain
    escrow_contract_address VARCHAR(255),  -- Solana contract account
    transaction_signature VARCHAR(255),
    
    -- Admin approval
    approved_by_admin_id UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    approval_notes TEXT,
    
    -- Dispute handling
    disputed BOOLEAN DEFAULT FALSE,
    dispute_reason TEXT,
    dispute_resolved BOOLEAN DEFAULT FALSE,
    dispute_resolved_by UUID REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,  -- Escrow expiration
    released_at TIMESTAMP,
    
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_land_id (land_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- ==================== CHAT MESSAGES TABLE ====================
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id VARCHAR(255) NOT NULL,  -- Group chat ID or listing_id:user1:user2
    sender_id UUID NOT NULL REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),  -- NULL for group chats
    
    -- Message content
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'system')),
    
    -- Attachments
    attachments JSONB,  -- Array of file URLs
    
    -- Fraud detection
    contains_external_link BOOLEAN DEFAULT FALSE,
    contains_phone BOOLEAN DEFAULT FALSE,
    fraud_alert BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_chat_id (chat_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_read (is_read)
);

-- ==================== OWNERSHIP HISTORY TABLE ====================
CREATE TABLE ownership_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    land_id UUID NOT NULL REFERENCES land(id),
    previous_owner_id UUID REFERENCES users(id),
    new_owner_id UUID NOT NULL REFERENCES users(id),
    
    -- Transfer details
    transfer_type VARCHAR(50) CHECK (transfer_type IN ('purchase', 'inheritance', 'transfer', 'initial')),
    transfer_date TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Blockchain record
    blockchain_tx VARCHAR(255),  -- Transaction signature
    blockchain_program_id VARCHAR(255),  -- Ownership program ID
    
    -- Documents
    transfer_documents JSONB,  -- Document URLs
    verified BOOLEAN DEFAULT FALSE,
    verified_by_admin_id UUID REFERENCES users(id),
    
    -- Public summary (non-sensitive)
    public_summary VARCHAR(500),  -- Can be shown to buyers
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_land_id (land_id),
    INDEX idx_new_owner_id (new_owner_id),
    INDEX idx_transfer_date (transfer_date),
    INDEX idx_blockchain_tx (blockchain_tx)
);

-- ==================== PAYMENT TRANSACTIONS TABLE ====================
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escrow_id UUID NOT NULL REFERENCES escrow(id),
    
    -- Transaction details
    transaction_type VARCHAR(50) CHECK (transaction_type IN ('deposit', 'release', 'refund')),
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(3),
    
    -- Payment method
    payment_method VARCHAR(50) CHECK (payment_method IN ('card', 'bank_transfer', 'crypto', 'wallet')),
    payment_reference VARCHAR(255),
    
    -- Blockchain
    blockchain_tx VARCHAR(255),
    blockchain_confirmed BOOLEAN DEFAULT FALSE,
    
    status VARCHAR(50) CHECK (status IN ('pending', 'completed', 'failed')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_escrow_id (escrow_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_status (status)
);

-- ==================== AUDIT LOG TABLE ====================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    
    -- Action details
    entity_type VARCHAR(100),
    entity_id UUID,
    action VARCHAR(50),
    changes JSONB,  -- Before/after data
    
    -- Context
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_entity_type (entity_type),
    INDEX idx_entity_id (entity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- ==================== NOTIFICATION TABLE ====================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    title VARCHAR(255),
    message TEXT,
    notification_type VARCHAR(50),  -- listing_approved, escrow_released, fraud_alert, etc.
    
    -- Reference
    related_entity_type VARCHAR(100),
    related_entity_id UUID,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- ==================== TRIGGERS FOR AUDIT ====================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_land_updated_at BEFORE UPDATE ON land
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_updated_at BEFORE UPDATE ON escrow
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== SPATIAL INDICES ====================

CREATE INDEX idx_land_location_gist ON land USING GIST(location);
CREATE INDEX idx_land_boundary_gist ON land USING GIST(boundary);

-- Find lands within radius
CREATE INDEX idx_land_location_btree ON land(id) WHERE location IS NOT NULL;

-- ==================== INITIAL ADMIN USER ====================
-- Insert default admin (password hash for 'admin123')
INSERT INTO users (email, name, password_hash, role, is_verified)
VALUES (
    'admin@landbiznes.com',
    'System Administrator',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5pmPH/3aKPPRm',
    'admin',
    TRUE
) ON CONFLICT DO NOTHING;

-- ==================== SAMPLE VIEWS ====================

-- View: Active Listings
CREATE OR REPLACE VIEW active_listings AS
SELECT 
    l.id,
    l.title,
    l.size_sqm,
    l.estimated_price,
    l.location_name,
    l.status,
    u.name as owner_name,
    u.email,
    COUNT(DISTINCT cm.id) as message_count,
    l.created_at
FROM land l
JOIN users u ON l.owner_id = u.id
LEFT JOIN chat_messages cm ON l.id::text = SPLIT_PART(cm.chat_id, ':', 1)
WHERE l.status = 'listed' AND l.deleted_at IS NULL
GROUP BY l.id, u.id;

-- View: Pending Verifications
CREATE OR REPLACE VIEW pending_verifications AS
SELECT 
    d.id,
    d.land_id,
    l.title as land_title,
    d.document_type,
    d.ai_fraud_score,
    u.email as uploaded_by_email,
    d.created_at
FROM documents d
JOIN land l ON d.land_id = l.id
JOIN users u ON d.uploaded_by_id = u.id
WHERE d.verified = FALSE
ORDER BY d.ai_fraud_score DESC, d.created_at ASC;

-- ==================== PERMISSIONS ====================
-- Set permissions for different roles
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO authenticated_user;

COMMIT;
