export class LushaApiService {
  private apiKey: string;
  // private baseUrl = 'https://api.lusha.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async enrichCompany(domain: string, companyName: string): Promise<any[]> {
    if (!this.apiKey) throw new Error('LUSHA_API_KEY is required for Enrichment.');
    
    console.log(`[Lusha API] Searching contacts for ${companyName} (${domain})`);
    
    try {
      const response = await fetch('/api/lusha/v1/person/search', {
        method: 'POST',
        headers: {
          'api_key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          filters: {
            company: {
              name: companyName,
              domain: domain
            },
            job_title: [
              'Managing Director', 
              'Operations Director', 
              'Facilities Manager', 
              'Property Manager', 
              'Energy Manager', 
              'Sustainability Manager'
            ]
          }
        })
      });
      
      if (!response.ok) {
        console.error('Lusha API error:', response.statusText);
        return [];
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Lusha API request failed:', error);
      return [];
    }
  }
}
