-- ============================================================================
-- SIH26095: Ministry of Social Justice and Empowerment (MoSJE)
-- PostgreSQL + PostGIS Production Schema
-- Real-Time Monitoring & Inspection Platform for DoSJE Welfare Institutions
-- ============================================================================

-- Enable PostGIS Spatial Extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. USERS & RBAC TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(80) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('NATIONAL_ADMIN', 'STATE_OFFICER', 'DISTRICT_INSPECTOR', 'SURPRISE_AUDITOR', 'FACILITY_HEAD')),
    designation VARCHAR(100) NOT NULL,
    state VARCHAR(50) DEFAULT 'ALL',
    district VARCHAR(50) DEFAULT 'ALL',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. FACILITIES TABLE (WITH POSTGIS POINT GEOMETRY & SPATIAL INDEX)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facilities (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'DOSJE-DL-001'
    name VARCHAR(200) NOT NULL,
    scheme_code VARCHAR(30) NOT NULL, -- 'AVYAY', 'NAPDDR', 'PM-AJAY', 'SMILE', 'DIVYANG'
    scheme_name VARCHAR(255) NOT NULL,
    organization_name VARCHAR(200) NOT NULL, -- Operating NGO or Govt Body
    in_charge_name VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(100),
    address TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    
    -- PostGIS Spatial Geometry (SRID 4326 - WGS84 GPS Coordinate System)
    geom GEOMETRY(Point, 4326) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geofence_radius_meters INTEGER DEFAULT 150, -- Permissible inspection boundary radius
    
    sanctioned_capacity INTEGER NOT NULL,
    enrolled_beneficiaries INTEGER NOT NULL,
    compliance_grade VARCHAR(5) DEFAULT 'A', -- 'A', 'B', 'C', 'CRITICAL'
    risk_score INTEGER DEFAULT 20, -- 0 (Safe) to 100 (Severe Risk / Urgent Audit)
    last_inspected_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial GIST Index for Ultra-Fast Geofence Lookups
CREATE INDEX IF NOT EXISTS idx_facilities_geom ON facilities USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_facilities_scheme ON facilities(scheme_code);
CREATE INDEX IF NOT EXISTS idx_facilities_state_dist ON facilities(state, district);

-- ----------------------------------------------------------------------------
-- 3. CCTV SURVEILLANCE CAMERAS TABLE (ONVIF & RTSP STREAMS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cctv_cameras (
    id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    camera_name VARCHAR(100) NOT NULL,
    location_tag VARCHAR(100) NOT NULL, -- 'Entrance Gate', 'Dining Area', 'Dormitory A', 'Medical Ward'
    onvif_ip VARCHAR(50) NOT NULL,
    onvif_port INTEGER DEFAULT 80,
    rtsp_url VARCHAR(255) NOT NULL,
    stream_type VARCHAR(20) DEFAULT 'RTSP',
    status VARCHAR(20) DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'MAINTENANCE', 'TAMPERED')),
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ptz_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cctv_facility ON cctv_cameras(facility_id);

-- ----------------------------------------------------------------------------
-- 4. FIELD & SURPRISE INSPECTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspections (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'INSP-2026-0891'
    facility_id VARCHAR(50) NOT NULL REFERENCES facilities(id),
    inspector_id UUID REFERENCES users(id),
    inspector_name VARCHAR(150) NOT NULL,
    inspection_type VARCHAR(20) NOT NULL CHECK (inspection_type IN ('SURPRISE_AUDIT', 'ROUTINE_PERIODIC', 'GRIEVANCE_TRIGGERED')),
    status VARCHAR(25) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FLAGGED_ANOMALY', 'REJECTED')),
    scheduled_date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Inspector Check-in Geo-location
    inspector_geom GEOMETRY(Point, 4326),
    inspector_latitude DOUBLE PRECISION,
    inspector_longitude DOUBLE PRECISION,
    geofence_verified BOOLEAN DEFAULT FALSE,
    distance_to_facility_meters DOUBLE PRECISION,
    
    -- Compliance Scores (0 to 100)
    score_infrastructure INTEGER,
    score_hygiene INTEGER,
    score_food_nutrition INTEGER,
    score_medical_care INTEGER,
    score_attendance INTEGER,
    total_compliance_score INTEGER,
    
    checklist_data JSONB, -- Detailed item answers and observations
    photos_evidence JSONB, -- Array of watermarked image URLs and SHA-256 hashes
    anomalies_detected JSONB, -- Flagged ghost beneficiaries, tampering, etc.
    
    -- Digital Signatures
    inspector_signature_hash VARCHAR(128),
    facility_head_signature_hash VARCHAR(128),
    
    -- Cryptographic Audit Package
    aes256_package_hash VARCHAR(64),
    synced_from_offline BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inspections_facility ON inspections(facility_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);

-- ----------------------------------------------------------------------------
-- 5. REMOTE VIDEO CONFERENCING (VC) SPOT-CHECKS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vc_spot_checks (
    id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL REFERENCES facilities(id),
    auditor_id UUID REFERENCES users(id),
    auditor_name VARCHAR(150) NOT NULL,
    session_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (session_status IN ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'NO_ANSWER')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    headcount_verified INTEGER,
    beneficiary_interaction_notes TEXT,
    snapshot_evidence_urls JSONB,
    tamper_proof_hash VARCHAR(64)
);

-- ----------------------------------------------------------------------------
-- 6. REAL-TIME ALERTS & ANOMALIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id VARCHAR(50) REFERENCES facilities(id),
    alert_type VARCHAR(50) NOT NULL, -- 'GHOST_BENEFICIARY', 'GEOFENCE_BREACH', 'CCTV_DOWNTIME', 'POOR_FOOD_QUALITY'
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- POSTGIS STORED FUNCTION: Geofence Distance Verification
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION verify_inspector_geofence(
    p_facility_id VARCHAR(50),
    p_inspector_lat DOUBLE PRECISION,
    p_inspector_lon DOUBLE PRECISION
)
RETURNS TABLE (
    is_within_geofence BOOLEAN,
    distance_meters DOUBLE PRECISION,
    facility_radius INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ST_DWithin(
            f.geom::geography,
            ST_SetSRID(ST_MakePoint(p_inspector_lon, p_inspector_lat), 4326)::geography,
            f.geofence_radius_meters
        ) AS is_within_geofence,
        ST_Distance(
            f.geom::geography,
            ST_SetSRID(ST_MakePoint(p_inspector_lon, p_inspector_lat), 4326)::geography
        ) AS distance_meters,
        f.geofence_radius_meters AS facility_radius
    FROM facilities f
    WHERE f.id = p_facility_id;
END;
$$ LANGUAGE plpgsql;
