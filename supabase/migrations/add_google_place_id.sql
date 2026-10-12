ALTER TABLE properties ADD COLUMN google_place_id TEXT;
CREATE UNIQUE INDEX idx_properties_google_place_id ON properties(google_place_id);
