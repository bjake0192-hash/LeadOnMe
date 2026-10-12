export type RoofMaterial = 'Metal' | 'Flat roof' | 'Tile' | 'Slate' | 'Other' | 'Unknown';
export type QualificationStatus = 'Discovered' | 'Awaiting roof assessment' | 'Roof qualified' | 'Awaiting company match' | 'Awaiting contact enrichment' | 'Qualified prospect' | 'Manual review' | 'Rejected' | 'Error';
export type JobStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Cancelled';

export interface Property {
  id: string;
  address: string;
  postcode: string | null;
  region: string | null;
  estimated_roof_area: number | null;
  roof_material: RoofMaterial;
  roof_material_confidence: number | null;
  qualification_status: QualificationStatus;
  data_source: string | null;
  verification_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  website: string | null;
  registered_address: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  company_id: string;
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_profile: string | null;
  source: string | null;
  do_not_contact: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertySearchJob {
  id: string;
  parameters: {
    country: string;
    region?: string;
    town?: string;
    postcode?: string;
    minRoofArea: number;
    maxRoofArea?: number;
    roofMaterial?: string;
    requireContacts?: boolean;
  };
  status: JobStatus;
  properties_discovered: number;
  properties_processed: number;
  errors: any;
  created_at: string;
  completed_at: string | null;
}
