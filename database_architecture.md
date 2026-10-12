# OpenLead Property Finder - Database Architecture

The application will use **Supabase PostgreSQL** for persistent storage. All tables will use `UUID` primary keys, include appropriate foreign keys, and enforce Row Level Security (RLS).

## Tables

### `properties`
Stores the core property records discovered during searches.
- `id` (UUID, Primary Key)
- `address` (Text)
- `postcode` (Text, Indexed)
- `region` (Text)
- `estimated_roof_area` (Numeric)
- `roof_material` (Text) - Enum: Metal, Flat roof, Tile, Slate, Other, Unknown
- `roof_material_confidence` (Numeric)
- `qualification_status` (Text, Indexed) - Enum: Discovered, Awaiting roof assessment, Roof qualified, Awaiting company match, Awaiting contact enrichment, Qualified prospect, Manual review, Rejected, Error
- `data_source` (Text)
- `verification_status` (Text)
- `created_at` (Timestamptz)
- `updated_at` (Timestamptz)

### `companies`
Stores distinct business entities to prevent duplication across multiple properties.
- `id` (UUID, Primary Key)
- `name` (Text, Indexed)
- `website` (Text)
- `registered_address` (Text)
- `source` (Text)
- `created_at` (Timestamptz)
- `updated_at` (Timestamptz)

### `property_company_matches`
Junction table linking properties to businesses with specific relationships.
- `id` (UUID, Primary Key)
- `property_id` (UUID, Foreign Key)
- `company_id` (UUID, Foreign Key)
- `relationship` (Text) - Enum: Property owner, Business occupier, Registered company, Unknown relationship
- `match_confidence` (Numeric)
- `source` (Text)
- `is_verified` (Boolean)
- `created_at` (Timestamptz)

### `contacts`
Stores individual decision-maker contacts. Kept separate from companies to manage compliance and suppression.
- `id` (UUID, Primary Key)
- `company_id` (UUID, Foreign Key)
- `first_name` (Text)
- `last_name` (Text)
- `job_title` (Text)
- `email` (Text)
- `phone` (Text)
- `linkedin_profile` (Text)
- `source` (Text)
- `do_not_contact` (Boolean) - For suppression lists
- `created_at` (Timestamptz)
- `updated_at` (Timestamptz)

### `roof_assessments`
Logs the historical assessment of roofs (e.g., via Google Solar API or imagery classification).
- `id` (UUID, Primary Key)
- `property_id` (UUID, Foreign Key)
- `provider` (Text)
- `area_estimate` (Numeric)
- `material_prediction` (Text)
- `confidence_score` (Numeric)
- `assessment_date` (Timestamptz)
- `status` (Text)

### `property_search_jobs`
Tracks asynchronous background jobs for discovering properties.
- `id` (UUID, Primary Key)
- `parameters` (JSONB) - Geographic and size filters
- `status` (Text) - Enum: Pending, Processing, Completed, Failed, Cancelled
- `properties_discovered` (Integer)
- `properties_processed` (Integer)
- `errors` (JSONB)
- `created_at` (Timestamptz)
- `completed_at` (Timestamptz)

### `contact_enrichment_jobs`
Tracks bulk or individual Lusha enrichment jobs.
- `id` (UUID, Primary Key)
- `target_id` (UUID) - Company or Property ID
- `job_roles` (JSONB)
- `status` (Text)
- `results_found` (Integer)
- `created_at` (Timestamptz)
- `completed_at` (Timestamptz)

### `api_usage_logs`
Tracks API consumption for cost control.
- `id` (UUID, Primary Key)
- `provider` (Text) - Google Solar, Lusha, VOA, etc.
- `endpoint` (Text)
- `credits_used` (Integer)
- `request_params` (JSONB)
- `response_status` (Text)
- `created_at` (Timestamptz)

### `audit_logs`
For compliance and tracking exports or manual overrides.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `action` (Text)
- `entity_type` (Text)
- `entity_id` (UUID)
- `details` (JSONB)
- `created_at` (Timestamptz)

## Security
- **Row Level Security (RLS)** will be enforced on all tables, ensuring only authenticated and authorized users can read or mutate records.
- API Secrets will be stored exclusively in Supabase Secrets / Server Environment variables, accessed only via secure Edge Functions or server-side API routes.
