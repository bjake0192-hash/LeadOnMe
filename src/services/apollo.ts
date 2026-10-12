export class ApolloApiService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async enrichCompany(domain: string, companyName: string): Promise<any[]> {
    if (!this.apiKey) throw new Error('APOLLO_API_KEY is required for Enrichment.');
    
    console.log(`[Apollo API] Searching contacts for ${companyName} (${domain})`);
    
    try {
      // 1. Search for matching people
      const searchResponse = await fetch('/api/apollo/v1/mixed_people/api_search', {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          q_organization_domains: domain,
          person_titles: [
            'Managing Director', 
            'Operations Director', 
            'Facilities Manager', 
            'Property Manager', 
            'Energy Manager', 
            'Sustainability Manager',
            'Director',
            'Owner',
            'CEO',
            'Founder'
          ],
          per_page: 3 // just get the top 3
        })
      });
      
      if (!searchResponse.ok) {
        console.error('Apollo API search error:', searchResponse.statusText);
        return [];
      }
      
      const searchData = await searchResponse.json();
      const people = searchData.people || [];
      
      if (people.length === 0) return [];

      // 2. Fetch details (emails/phones) for these people
      const ids = people.map((p: any) => ({ id: p.id }));
      
      const matchResponse = await fetch('/api/apollo/v1/people/bulk_match', {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          details: ids
        })
      });

      if (!matchResponse.ok) {
        console.error('Apollo API match error:', matchResponse.statusText);
        return [];
      }

      const matchData = await matchResponse.json();
      const matches = matchData.matches || [];

      // Map Apollo format to the expected format
      return matches.map((match: any) => {
        let phone = '';
        if (match.phone_numbers && match.phone_numbers.length > 0) {
            phone = match.phone_numbers[0].sanitized_number || match.phone_numbers[0].number;
        } else if (match.organization?.primary_phone?.sanitized_number) {
            phone = match.organization.primary_phone.sanitized_number;
        }

        return {
          firstName: match.first_name,
          lastName: match.last_name,
          jobTitle: match.title,
          email: match.email,
          phone: phone,
          linkedin: match.linkedin_url
        };
      });

    } catch (error) {
      console.error('Apollo API request failed:', error);
      return [];
    }
  }
}
