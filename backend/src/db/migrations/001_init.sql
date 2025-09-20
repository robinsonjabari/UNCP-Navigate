-- UNCP Navigate Database Schema
-- Initial database setup and table creation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS extension for geospatial data (if needed for advanced mapping)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'visitor' CHECK (role IN ('student', 'faculty', 'staff', 'visitor', 'admin')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Places table for campus locations
CREATE TABLE places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('academic', 'administrative', 'dining', 'recreation', 'residence', 'parking', 'other')),
    coordinates JSONB NOT NULL, -- {lat: number, lng: number}
    address TEXT,
    hours JSONB, -- {open: string, close: string} or more complex schedule
    amenities JSONB, -- array of amenity names
    accessibility BOOLEAN DEFAULT false,
    images JSONB, -- array of image URLs
    floor_plans JSONB, -- array of floor plan URLs
    reviews JSONB, -- {average: number, count: number}
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Place categories lookup table
CREATE TABLE place_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100), -- icon name or URL
    color VARCHAR(7) -- hex color code
);

-- User favorites
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, place_id)
);

-- Place visits tracking
CREATE TABLE place_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    visit_type VARCHAR(20) DEFAULT 'view' CHECK (visit_type IN ('view', 'navigate', 'arrive')),
    session_id VARCHAR(255), -- for anonymous users
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routes tracking
CREATE TABLE route_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    origin JSONB NOT NULL, -- {lat: number, lng: number}
    destination JSONB NOT NULL, -- {lat: number, lng: number}
    mode VARCHAR(20) DEFAULT 'walking' CHECK (mode IN ('walking', 'driving', 'cycling')),
    accessibility BOOLEAN DEFAULT false,
    distance DECIMAL(10, 2), -- in meters
    duration INTEGER, -- in seconds
    session_id VARCHAR(255), -- for anonymous users
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback and reports
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'general')),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    email VARCHAR(255), -- for anonymous feedback
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage tracking
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time INTEGER, -- in milliseconds
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency contacts and information
CREATE TABLE emergency_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    description TEXT,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campus events (for navigation context)
CREATE TABLE campus_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    location_id UUID REFERENCES places(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type VARCHAR(50),
    is_public BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_coordinates ON places USING GIN(coordinates);
CREATE INDEX idx_place_visits_place_id ON place_visits(place_id);
CREATE INDEX idx_place_visits_created_at ON place_visits(created_at);
CREATE INDEX idx_route_requests_created_at ON route_requests(created_at);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_type ON feedback(type);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at);
CREATE INDEX idx_campus_events_start_time ON campus_events(start_time);
CREATE INDEX idx_campus_events_location_id ON campus_events(location_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_info_updated_at BEFORE UPDATE ON emergency_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campus_events_updated_at BEFORE UPDATE ON campus_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies can be added here for multi-tenant security
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY user_policy ON users FOR ALL TO authenticated_user USING (id = current_user_id());

COMMENT ON TABLE users IS 'User accounts for the UNCP Navigate system';
COMMENT ON TABLE places IS 'Campus locations and points of interest';
COMMENT ON TABLE place_visits IS 'Tracking of place views and visits for analytics';
COMMENT ON TABLE route_requests IS 'Tracking of route calculations for analytics and optimization';
COMMENT ON TABLE feedback IS 'User feedback and issue reports';
COMMENT ON TABLE api_usage IS 'API endpoint usage tracking for monitoring and analytics';