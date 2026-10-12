export class GoogleApiService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!this.apiKey) throw new Error('GOOGLE_API_KEY is required for Geocoding.');
    
    const url = `/api/google-maps/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].geometry.location;
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  async discoverCommercialProperties(location: string): Promise<any[]> {
    if (!this.apiKey) throw new Error('GOOGLE_API_KEY is required for Places API.');

    const centerPoint = await this.geocode(location + ', UK');
    if (!centerPoint) {
        throw new Error('Could not find the specified location.');
    }

    const url = `/api/google-places/v1/places:searchText`;
    const queries = [
      `Industrial Estate in ${location}`,
      `Trading Estate in ${location}`,
      `Business Park in ${location}`,
      `Warehouse in ${location}`,
      `Factory in ${location}`,
      `Industrial Unit in ${location}`
    ];
    
    let allPlaces: any[] = [];

    for (const query of queries) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.location,places.types,places.editorialSummary'
          },
          body: JSON.stringify({
            textQuery: query,
            maxResultCount: 20, 
            locationBias: {
              circle: {
                center: { latitude: centerPoint.lat, longitude: centerPoint.lng },
                radius: 5000.0 // 5km radius
              }
            }
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.places) {
            allPlaces = [...allPlaces, ...data.places];
          }
        }
      } catch (error) {
        console.error(`Error with query "${query}":`, error);
      }
    }

    // Return the combined results (duplicates will be filtered by discovery.ts)
    return allPlaces;
  }

  async discoverSubUnits(estateName: string, lat: number, lng: number): Promise<any[]> {
    if (!this.apiKey) throw new Error('GOOGLE_API_KEY is required for Places API.');

    const url = `/api/google-places/v1/places:searchText`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.location,places.types'
        },
        body: JSON.stringify({
          textQuery: `businesses in ${estateName}`,
          maxResultCount: 20,
          locationBias: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: 200.0 // Very tight radius to find units within the estate
            }
          }
        })
      });
      
      if (!response.ok) return [];
      const data = await response.json();
      
      // Filter out the estate itself from the results to get only units/tenants
      return (data.places || []).filter((p: any) => 
        !p.displayName?.text?.toLowerCase().includes('estate') &&
        !p.displayName?.text?.toLowerCase().includes('park')
      );
    } catch (error) {
      console.error('Sub-unit discovery error:', error);
      return [];
    }
  }

  async getSolarInsights(lat: number, lng: number): Promise<{ maxArrayAreaMeters2: number } | null> {
    if (!this.apiKey) throw new Error('GOOGLE_API_KEY is required for Solar API.');
    
    const url = `/api/google-solar/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Solar API Error Response:', errorData);
        if (response.status === 403) {
          throw new Error('Solar API Access Forbidden: Please enable Solar API and check API key restrictions in Google Cloud Console.');
        }
        return null;
      }
      
      const data = await response.json();
      return {
        maxArrayAreaMeters2: data.solarPotential?.maxArrayAreaMeters2 || 0
      };
    } catch (error) {
      console.error('Solar API error:', error);
      throw error; // Re-throw to handle in discovery service
    }
  }

  async findCompanyAtAddress(address: string, lat: number, lng: number): Promise<{ name: string; website?: string } | null> {
    if (!this.apiKey) throw new Error('GOOGLE_API_KEY is required for Places API.');
    
    const url = `/api/google-places/v1/places:searchText`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.websiteUri,places.businessStatus'
        },
        body: JSON.stringify({
          textQuery: `business at ${address}`,
          locationBias: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: 50.0 // 50 meters
            }
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Places API (Match) Error Response:', errorData);
        return null;
      }
      const data = await response.json();
      
      if (data.places && data.places.length > 0) {
        return {
          name: data.places[0].displayName?.text,
          website: data.places[0].websiteUri
        };
      }
      return null;
    } catch (error) {
      console.error('Places API error:', error);
      return null;
    }
  }
}
