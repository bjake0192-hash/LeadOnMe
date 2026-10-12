-- Allow anon users to manage search jobs
CREATE POLICY "Allow anon insert access" ON property_search_jobs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon select access" ON property_search_jobs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon update access" ON property_search_jobs FOR UPDATE TO anon USING (true);

-- Allow anon users to insert properties and related data (since discovery runs in frontend)
CREATE POLICY "Allow anon insert access" ON properties FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert access" ON companies FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert access" ON property_company_matches FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert access" ON contacts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert access" ON api_usage_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert access" ON audit_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert access" ON roof_assessments FOR INSERT TO anon WITH CHECK (true);

-- Allow anon read access for assessments and logs (for UI)
CREATE POLICY "Allow anon read access" ON roof_assessments FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read access" ON api_usage_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read access" ON audit_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read access" ON property_search_jobs FOR SELECT TO anon USING (true);
