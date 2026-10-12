-- Create custom types for enums
CREATE TYPE roof_material_type AS ENUM ('Metal', 'Flat roof', 'Tile', 'Slate', 'Other', 'Unknown');
CREATE TYPE qualification_status_type AS ENUM ('Discovered', 'Awaiting roof assessment', 'Roof qualified', 'Awaiting company match', 'Awaiting contact enrichment', 'Qualified prospect', 'Manual review', 'Rejected', 'Error');
CREATE TYPE relationship_type AS ENUM ('Property owner', 'Business occupier', 'Registered company', 'Unknown relationship');
CREATE TYPE job_status_type AS ENUM ('Pending', 'Processing', 'Completed', 'Failed', 'Cancelled');

-- Create properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    postcode TEXT,
    region TEXT,
    estimated_roof_area NUMERIC,
    roof_material roof_material_type DEFAULT 'Unknown',
    roof_material_confidence NUMERIC,
    qualification_status qualification_status_type DEFAULT 'Discovered',
    data_source TEXT,
    verification_status TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    website TEXT,
    registered_address TEXT,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create property_company_matches table
CREATE TABLE property_company_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    relationship relationship_type DEFAULT 'Unknown relationship',
    match_confidence NUMERIC,
    source TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    job_title TEXT,
    email TEXT,
    phone TEXT,
    linkedin_profile TEXT,
    source TEXT,
    do_not_contact BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create roof_assessments table
CREATE TABLE roof_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    provider TEXT,
    area_estimate NUMERIC,
    material_prediction TEXT,
    confidence_score NUMERIC,
    assessment_date TIMESTAMPTZ DEFAULT now(),
    status TEXT
);

-- Create property_search_jobs table
CREATE TABLE property_search_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parameters JSONB,
    status job_status_type DEFAULT 'Pending',
    properties_discovered INTEGER DEFAULT 0,
    properties_processed INTEGER DEFAULT 0,
    errors JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Create contact_enrichment_jobs table
CREATE TABLE contact_enrichment_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID,
    job_roles JSONB,
    status job_status_type DEFAULT 'Pending',
    results_found INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Create api_usage_logs table
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT,
    endpoint TEXT,
    credits_used INTEGER DEFAULT 0,
    request_params JSONB,
    response_status TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_properties_postcode ON properties(postcode);
CREATE INDEX idx_properties_qualification_status ON properties(qualification_status);
CREATE INDEX idx_companies_name ON companies(name);

-- Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_company_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE roof_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_search_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_enrichment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to access data
-- For simplicity, allowing all authenticated users to read/write for now
-- Note: Replace these with more restrictive policies in a production environment
CREATE POLICY "Allow full access to authenticated users" ON properties FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON companies FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON property_company_matches FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON contacts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON roof_assessments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON property_search_jobs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON contact_enrichment_jobs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON api_usage_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON audit_logs FOR ALL TO authenticated USING (true);

-- Also allow anonymous access for development (if needed, otherwise remove)
CREATE POLICY "Allow anon read access" ON properties FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read access" ON companies FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read access" ON property_company_matches FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read access" ON contacts FOR SELECT TO anon USING (true);
