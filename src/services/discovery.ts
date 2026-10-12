import { GoogleApiService } from './google';
import { VoaApiService } from './voa';
import { LushaApiService } from './lusha';
import { ApolloApiService } from './apollo';
import { supabase } from '../lib/supabase';

export interface DiscoveryParams {
  country: string;
  region?: string;
  town?: string;
  postcode?: string;
  minRoofArea: number;
  maxRoofArea?: number;
  roofMaterial?: string;
  requireContacts: boolean;
}

export class DiscoveryService {
  private googleApi: GoogleApiService;
  private apolloApi: ApolloApiService;
  private voaApi: VoaApiService;

  constructor(googleApiKey: string, lushaApiKey: string, voaApiKey: string) {
    this.googleApi = new GoogleApiService(googleApiKey);
    this.apolloApi = new ApolloApiService(import.meta.env.VITE_APOLLO_API_KEY || '');
    this.voaApi = new VoaApiService(voaApiKey);
  }

  async runDiscovery(jobId: string, params: DiscoveryParams, onProgress: (stats: any) => void) {
    const stats = {
      discovered: 0,
      assessed: 0,
      passedRoof: 0,
      metalIdentified: 0,
      companiesMatched: 0,
      contactsFound: 0,
      qualified: 0,
      errors: 0
    };

    const logApiUsage = async (provider: string, endpoint: string, credits: number) => {
      await supabase.from('api_usage_logs').insert({
        provider,
        endpoint,
        credits_used: credits,
        request_params: params
      });
    };

    const updateStats = async (newStats: Partial<typeof stats>) => {
      Object.assign(stats, newStats);
      onProgress(stats);
      await supabase.from('property_search_jobs').update({
        properties_discovered: stats.discovered,
        properties_processed: stats.assessed,
        status: 'Processing'
      }).eq('id', jobId);
    };

    try {
      // STAGE 1: DISCOVER PROPERTIES (Prioritizing Google Places for real data)
      console.log('Stage 1: Discovering properties...');
      let discoveredProperties = [];
      
      if (params.postcode || params.town) {
        // We use Google Places as primary because it provides real coordinates and formatted data
        try {
          console.log(`Using Google Places for discovery in ${params.postcode || params.town}`);
          discoveredProperties = await this.googleApi.discoverCommercialProperties(
            params.postcode || params.town || ''
          );
          await logApiUsage('Google Places', 'searchText', 1);

          // If Google fails or returns nothing, we COULD try VOA if an API key exists
          if (discoveredProperties.length === 0 && !import.meta.env.VITE_VOA_API_KEY?.includes('dummy')) {
            console.log('Falling back to VOA API...');
            discoveredProperties = await this.voaApi.searchProperties({ 
              postcode: params.postcode, 
              town: params.town 
            });
            await logApiUsage('VOA', 'searchProperties', 1);
          }
        } catch (e) {
          console.error('Discovery failed:', e);
        }
      }

      await updateStats({ discovered: discoveredProperties.length });

      // Create a processing queue to handle both top-level properties and sub-units
      const processingQueue = [...discoveredProperties];
      const processedIds = new Set();
      // Fetch existing addresses from DB to prevent duplicates across jobs
      const { data: existingProperties } = await supabase.from('properties').select('address');
      
      const normalizeAddress = (addr: string) => 
        (addr || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

      const processedAddresses = new Set(
        (existingProperties || []).map(p => normalizeAddress(p.address))
      );

      while (processingQueue.length > 0) {
        const prop = processingQueue.shift();
        const propertyAddress = prop?.formattedAddress || prop?.address || '';
        const propId = prop?.id || propertyAddress;
        
        if (!prop || processedIds.has(propId)) continue;
        
        const normalized = normalizeAddress(propertyAddress);
        
        if (processedAddresses.has(normalized)) continue;
        
        processedIds.add(propId);
        processedAddresses.add(normalized);

        try {
          const displayName = prop.displayName?.text || '';
          
          // If we found an "Industrial Estate" or "Business Park", drill down for specific units
          if (displayName.toLowerCase().includes('estate') || displayName.toLowerCase().includes('park')) {
            console.log(`Drilling down into ${displayName} for specific units...`);
            const subUnits = await this.googleApi.discoverSubUnits(
              displayName,
              prop.location?.latitude,
              prop.location?.longitude
            );
            
            if (subUnits.length > 0) {
              console.log(`Found ${subUnits.length} potential units in ${displayName}`);
              processingQueue.push(...subUnits);
              await updateStats({ discovered: stats.discovered + subUnits.length });
              // Continue to next item in queue, skipping the estate itself if it's not a direct target
              continue;
            }
          }

          // STAGE 2: CHECK ROOF SIZE
          console.log(`Stage 2: Checking roof size for ${propertyAddress}...`);
          
          let lat = prop.location?.latitude;
          let lng = prop.location?.longitude;

          // If location is missing (e.g. from VOA), geocode it
          if (!lat || !lng) {
            const coords = await this.googleApi.geocode(propertyAddress);
            await logApiUsage('Google Geocoding', 'geocode', 1);
            if (coords) {
              lat = coords.lat;
              lng = coords.lng;
            }
          }

          if (lat && lng) {
            let solarData: { maxArrayAreaMeters2: number; isFallback?: boolean } | null = null;
            try {
              solarData = await this.googleApi.getSolarInsights(lat, lng);
            } catch (err: any) {
              if (err.message.includes('Solar API Access Forbidden')) {
                console.warn('Google Solar API access forbidden. Using fallback roof assessment (ESTIMATED).');
                solarData = { maxArrayAreaMeters2: 250, isFallback: true }; 
              } else {
                throw err;
              }
            }

            await logApiUsage('Google Solar', 'buildingInsights', 1);
            await updateStats({ assessed: stats.assessed + 1 });

            if (solarData && solarData.maxArrayAreaMeters2 >= params.minRoofArea) {
              await updateStats({ passedRoof: stats.passedRoof + 1 });

              // STAGE 3: IDENTIFY METAL ROOFS
              const description = (prop.description || prop.displayName?.text || '').toLowerCase();
              const isIndustrial = description.includes('warehouse') || 
                                  description.includes('industrial') ||
                                  description.includes('factory') ||
                                  description.includes('unit');
              
              if (params.roofMaterial === 'Metal' && !isIndustrial) continue;
              await updateStats({ metalIdentified: stats.metalIdentified + 1 });

              // STAGE 4: SAVE QUALIFIED PROSPECT
              // Check for existing property using limit(1) to avoid maybeSingle() crash on existing duplicates
              let { data: existingData } = await supabase
                .from('properties')
                .select()
                .eq('google_place_id', prop.id)
                .limit(1);
                
              let propertyData = existingData?.[0];

              if (!propertyData) {
                const { data: newProp, error: propError } = await supabase.from('properties').insert({
                  address: propertyAddress,
                  postcode: prop.postcode || '',
                  region: params.region || '',
                  estimated_roof_area: solarData.maxArrayAreaMeters2,
                  roof_material: isIndustrial ? 'Metal' : 'Other',
                  roof_material_confidence: isIndustrial ? 85 : 40,
                  qualification_status: 'Qualified prospect',
                  data_source: solarData.isFallback ? 'Discovery Engine (Fallback)' : 'Discovery Engine',
                  verification_status: solarData.isFallback ? 'Unverified (Estimated)' : 'Unverified'
                }).select().single();

                if (propError) throw propError;
                propertyData = newProp;
                await updateStats({ qualified: stats.qualified + 1 });
              } else {
                console.log(`Property already exists at ${propertyAddress}. Skipping insert.`);
                // Still count as qualified for current job stats if it's already in DB
                await updateStats({ qualified: stats.qualified + 1 });
              }

              if (!propertyData) throw new Error('Failed to retrieve or create property record');

              // STAGE 5: MATCH THE PROPERTY TO A BUSINESS
              // Check if the displayName is just a generic unit/building name rather than a company
              let business = null;
              const nameLower = (prop.displayName?.text || '').toLowerCase();
              const isGenericName = 
                !prop.websiteUri && (
                  nameLower.startsWith('unit ') || 
                  nameLower.startsWith('warehouse ') || 
                  nameLower.startsWith('factory ') || 
                  nameLower.startsWith('plot ') ||
                  nameLower.match(/^[0-9]+$/) !== null // Just a number
                );

              if (prop.displayName?.text && !isGenericName) {
                business = {
                  name: prop.displayName.text,
                  website: prop.websiteUri
                };
              } else {
                console.log(`Generic building name "${prop.displayName?.text}" detected. Searching for tenant company...`);
                business = await this.googleApi.findCompanyAtAddress(propertyAddress, lat, lng);
                await logApiUsage('Google Places', 'matchCompany', 1);
              }

              if (business) {
                await updateStats({ companiesMatched: stats.companiesMatched + 1 });

                const { data: companyData, error: compError } = await supabase.from('companies').insert({
                  name: business.name,
                  website: business.website,
                  source: 'Google Places'
                }).select().single();

                if (compError) {
                  console.warn('Could not save company details:', compError);
                } else if (companyData) {
                  await supabase.from('property_company_matches').insert({
                    property_id: propertyData.id,
                    company_id: companyData.id,
                    relationship: 'Business occupier',
                    match_confidence: 90,
                    source: 'Google Places'
                  });

                  // STAGE 6: FIND CONTACT DETAILS (Optional enrichment)
                   let contacts = [];
                   if (params.requireContacts && business.website) {
                     try {
                      const domain = new URL(business.website).hostname.replace('www.', '');
                      contacts = await this.apolloApi.enrichCompany(domain, business.name);
                      await logApiUsage('Apollo', 'enrichCompany', contacts.length);
                      
                      if (contacts.length > 0) {
                        await updateStats({ contactsFound: stats.contactsFound + contacts.length });
                        for (const contact of contacts) {
                          await supabase.from('contacts').insert({
                            company_id: companyData.id,
                            first_name: contact.firstName,
                            last_name: contact.lastName,
                            job_title: contact.jobTitle,
                            email: contact.email,
                            phone: contact.phone,
                            source: 'Apollo'
                          });
                        }
                      }
                    } catch (e) {
                      console.warn('Lusha enrichment failed:', e);
                    }
                  }
                }

                await supabase.from('audit_logs').insert({
                  action: 'PROSPECT_QUALIFIED',
                  entity_type: 'property',
                  entity_id: propertyData.id,
                  details: { company: business.name }
                });
              } else {
                // Log that no company was found but property is still qualified
                await supabase.from('audit_logs').insert({
                  action: 'PROSPECT_QUALIFIED',
                  entity_type: 'property',
                  entity_id: propertyData.id,
                  details: { note: 'No company matched during discovery' }
                });
              }
            }
          }
        } catch (err) {
          console.error(`Error processing property:`, err);
          await updateStats({ errors: stats.errors + 1 });
        }
      }

      await supabase.from('property_search_jobs').update({
        status: 'Completed',
        completed_at: new Date().toISOString()
      }).eq('id', jobId);

    } catch (err) {
      console.error('Discovery process failed:', err);
      await supabase.from('property_search_jobs').update({
        status: 'Failed',
        errors: { message: (err as Error).message }
      }).eq('id', jobId);
    }
  }
}
