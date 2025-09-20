-- UNCP Navigate Seed Data
-- Insert initial data for development and testing

-- Insert default place categories
INSERT INTO place_categories (name, description, icon, color) VALUES
('academic', 'Academic buildings and classrooms', 'school', '#2E7D32'),
('administrative', 'Administrative offices and services', 'business', '#1976D2'),
('dining', 'Dining halls, cafeterias, and food services', 'restaurant', '#F57C00'),
('recreation', 'Recreational facilities and sports venues', 'fitness_center', '#7B1FA2'),
('residence', 'Dormitories and residential halls', 'home', '#5D4037'),
('parking', 'Parking lots and garages', 'local_parking', '#424242'),
('other', 'Other campus facilities', 'place', '#616161');

-- Insert emergency contacts
INSERT INTO emergency_info (service_name, phone, description, is_primary) VALUES
('Emergency Services', '911', 'Police, Fire, and Medical emergencies', true),
('Campus Police', '910-521-6235', 'UNCP Campus Police Department', true),
('Campus Safety', '910-521-6000', 'General campus safety and security', false),
('Health Services', '910-521-6240', 'Student Health Services', false),
('Facilities Management', '910-521-6262', 'Building and facility issues', false);

-- Insert sample campus places
INSERT INTO places (name, description, category, coordinates, address, hours, amenities, accessibility, images) VALUES
(
    'Chavis Student Center',
    'The heart of student life at UNCP, featuring dining options, meeting spaces, offices, and recreational activities.',
    'administrative',
    '{"lat": 34.7270, "lng": -79.0187}',
    '1 University Dr, Pembroke, NC 28372',
    '{"open": "07:00", "close": "22:00"}',
    '["WiFi", "Food Court", "Meeting Rooms", "ATM", "Bookstore", "Student Services"]',
    true,
    '["/images/chavis-center-1.jpg", "/images/chavis-center-2.jpg"]'
),
(
    'Mary Livermore Library',
    'The main academic library providing research resources, study spaces, computer labs, and academic support services.',
    'academic',
    '{"lat": 34.7265, "lng": -79.0175}',
    '1 University Dr, Pembroke, NC 28372',
    '{"open": "08:00", "close": "23:00"}',
    '["WiFi", "Study Rooms", "Computer Lab", "Printing", "Research Assistance", "Silent Study Areas"]',
    true,
    '["/images/library-1.jpg", "/images/library-2.jpg"]'
),
(
    'Sampson Hall',
    'Main academic building housing multiple departments including English, History, and Social Sciences.',
    'academic',
    '{"lat": 34.7268, "lng": -79.0190}',
    '1 University Dr, Pembroke, NC 28372',
    '{"open": "07:00", "close": "22:00"}',
    '["WiFi", "Classrooms", "Faculty Offices", "Elevators"]',
    true,
    '["/images/sampson-hall.jpg"]'
),
(
    'UNCP Dining Hall',
    'Main dining facility offering various meal options and catering to diverse dietary needs.',
    'dining',
    '{"lat": 34.7275, "lng": -79.0180}',
    '1 University Dr, Pembroke, NC 28372',
    '{"open": "07:00", "close": "21:00"}',
    '["All-You-Can-Eat", "Vegetarian Options", "Halal Options", "Outdoor Seating"]',
    true,
    '["/images/dining-hall-1.jpg", "/images/dining-hall-2.jpg"]'
),
(
    'Health & Physical Education Center',
    'Recreation and fitness center with gym facilities, courts, and exercise equipment.',
    'recreation',
    '{"lat": 34.7280, "lng": -79.0195}',
    '1 University Dr, Pembroke, NC 28372',
    '{"open": "06:00", "close": "23:00"}',
    '["Gym", "Basketball Courts", "Weight Room", "Locker Rooms", "Swimming Pool"]',
    true,
    '["/images/hpe-center.jpg"]'
),
(
    'Belk Residence Hall',
    'Student residential hall providing housing for undergraduate students.',
    'residence',
    '{"lat": 34.7260, "lng": -79.0170}',
    '1 University Dr, Pembroke, NC 28372',
    '{"open": "00:00", "close": "23:59"}',
    '["WiFi", "Laundry", "Study Lounges", "Kitchen Facilities"]',
    true,
    '["/images/belk-hall.jpg"]'
),
(
    'Main Parking Lot A',
    'Primary student parking area near academic buildings.',
    'parking',
    '{"lat": 34.7285, "lng": -79.0200}',
    '1 University Dr, Pembroke, NC 28372',
    '{"open": "00:00", "close": "23:59"}',
    '["Student Parking", "Handicap Accessible", "Emergency Call Boxes", "Lighting"]',
    true,
    '[]'
),
(
    'UNCP Performing Arts Center',
    'Cultural hub featuring theater performances, concerts, and community events.',
    'other',
    '{"lat": 34.7262, "lng": -79.0195}',
    '1 University Dr, Pembroke, NC 28372',
    '{"open": "09:00", "close": "22:00"}',
    '["Theater", "Concert Hall", "Box Office", "WiFi"]',
    true,
    '["/images/performing-arts-center.jpg"]'
),
(
    'Science Building',
    'Modern facility housing laboratories and classrooms for science departments.',
    'academic',
    '{"lat": 34.7272, "lng": -79.0165}',
    '1 University Dr, Pembroke, NC 28372',
    '{"open": "07:00", "close": "22:00"}',
    '["Research Labs", "Computer Labs", "WiFi", "Safety Equipment"]',
    true,
    '["/images/science-building.jpg"]'
),
(
    'Business Administration Building',
    'Home to the School of Business with modern classrooms and technology.',
    'academic',
    '{"lat": 34.7255, "lng": -79.0185}',
    '1 University Dr, Pembroke, NC 28372',
    '{"open": "07:00", "close": "22:00"}',
    '["Smart Classrooms", "Computer Labs", "WiFi", "Conference Rooms"]',
    true,
    '["/images/business-building.jpg"]'
);

-- Insert sample admin user (password should be hashed in real implementation)
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) VALUES
('admin@uncp.edu', '$2b$10$rQZ1vZ1vZ1vZ1vZ1vZ1vZu', 'System', 'Administrator', 'admin', true),
('demo@uncp.edu', '$2b$10$rQZ1vZ1vZ1vZ1vZ1vZ1vZu', 'Demo', 'User', 'student', true);

-- Insert sample feedback
INSERT INTO feedback (user_id, type, subject, message, rating, email) VALUES
(
    (SELECT id FROM users WHERE email = 'demo@uncp.edu'),
    'feature',
    'Indoor navigation request',
    'It would be great to have indoor navigation for large buildings like the library and student center.',
    4,
    'demo@uncp.edu'
),
(
    NULL,
    'bug',
    'Map loading issue on mobile',
    'The interactive map sometimes fails to load on my iPhone. Refreshing the page usually fixes it.',
    2,
    'anonymous@student.com'
);

-- Insert sample campus events
INSERT INTO campus_events (title, description, location_id, start_time, end_time, event_type, created_by) VALUES
(
    'Fall Semester Orientation',
    'Welcome event for new students including campus tour and information sessions.',
    (SELECT id FROM places WHERE name = 'Chavis Student Center'),
    '2024-08-20 09:00:00-04',
    '2024-08-20 17:00:00-04',
    'orientation',
    (SELECT id FROM users WHERE email = 'admin@uncp.edu')
),
(
    'Library Research Workshop',
    'Learn how to use library resources and databases for academic research.',
    (SELECT id FROM places WHERE name = 'Mary Livermore Library'),
    '2024-09-15 14:00:00-04',
    '2024-09-15 16:00:00-04',
    'workshop',
    (SELECT id FROM users WHERE email = 'admin@uncp.edu')
);

-- Add some sample visit tracking data for analytics
INSERT INTO place_visits (place_id, visit_type, session_id, ip_address, created_at) VALUES
((SELECT id FROM places WHERE name = 'Chavis Student Center'), 'view', 'session1', '192.168.1.100', NOW() - INTERVAL '1 day'),
((SELECT id FROM places WHERE name = 'Mary Livermore Library'), 'navigate', 'session2', '192.168.1.101', NOW() - INTERVAL '2 hours'),
((SELECT id FROM places WHERE name = 'UNCP Dining Hall'), 'view', 'session3', '192.168.1.102', NOW() - INTERVAL '30 minutes'),
((SELECT id FROM places WHERE name = 'Health & Physical Education Center'), 'navigate', 'session4', '192.168.1.103', NOW() - INTERVAL '1 hour');

-- Add sample route requests for analytics
INSERT INTO route_requests (origin, destination, mode, distance, duration, session_id, ip_address, created_at) VALUES
(
    '{"lat": 34.7270, "lng": -79.0187}',
    '{"lat": 34.7265, "lng": -79.0175}',
    'walking',
    450.5,
    324,
    'session1',
    '192.168.1.100',
    NOW() - INTERVAL '2 hours'
),
(
    '{"lat": 34.7265, "lng": -79.0175}',
    '{"lat": 34.7275, "lng": -79.0180}',
    'walking',
    380.2,
    285,
    'session2',
    '192.168.1.101',
    NOW() - INTERVAL '1 hour'
);

-- Update statistics for testing
UPDATE places SET reviews = '{"average": 4.2, "count": 156}' WHERE name = 'Chavis Student Center';
UPDATE places SET reviews = '{"average": 4.5, "count": 203}' WHERE name = 'Mary Livermore Library';
UPDATE places SET reviews = '{"average": 3.8, "count": 89}' WHERE name = 'UNCP Dining Hall';

-- Add some API usage tracking for development
INSERT INTO api_usage (endpoint, method, status_code, response_time, ip_address, session_id, created_at) VALUES
('/api/places', 'GET', 200, 145, '192.168.1.100', 'session1', NOW() - INTERVAL '1 hour'),
('/api/routes/directions', 'POST', 200, 256, '192.168.1.101', 'session2', NOW() - INTERVAL '30 minutes'),
('/api/auth/login', 'POST', 200, 189, '192.168.1.102', 'session3', NOW() - INTERVAL '15 minutes');

-- Create some user favorites for testing
INSERT INTO user_favorites (user_id, place_id) VALUES
((SELECT id FROM users WHERE email = 'demo@uncp.edu'), (SELECT id FROM places WHERE name = 'Mary Livermore Library')),
((SELECT id FROM users WHERE email = 'demo@uncp.edu'), (SELECT id FROM places WHERE name = 'Chavis Student Center'));

COMMENT ON TABLE place_categories IS 'Populated with standard campus location categories';
COMMENT ON TABLE emergency_info IS 'Populated with UNCP emergency contact information';
COMMENT ON TABLE places IS 'Populated with major UNCP campus locations and facilities';
COMMENT ON TABLE users IS 'Populated with sample admin and demo user accounts';
COMMENT ON TABLE feedback IS 'Populated with sample user feedback for testing';
COMMENT ON TABLE campus_events IS 'Populated with sample campus events';