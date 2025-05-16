-- Add new fields to run_clubs table
ALTER TABLE run_clubs 
ADD COLUMN meeting_days TEXT[],
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME,
ADD COLUMN start_location TEXT,
ADD COLUMN end_location TEXT,
ADD COLUMN route_details TEXT,
ADD COLUMN distance TEXT; 