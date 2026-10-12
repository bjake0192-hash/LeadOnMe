import { useState } from 'react';
import { Key, Server, Shield, CheckCircle2, XCircle } from 'lucide-react';

export default function SettingsPage() {
  const [integrations] = useState([
    {
      id: 'google_places_discovery',
      name: 'Google Places API (Discovery)',
      description: 'Discover commercial properties in the UK.',
      status: 'configured',
      lastSync: '2 hours ago'
    },
    {
      id: 'google_solar',
      name: 'Google Solar API',
      description: 'Estimate roof areas for properties.',
      status: 'configured',
      lastSync: '10 mins ago'
    },
    {
      id: 'google_places_match',
      name: 'Google Places API (Matching)',
      description: 'Match properties to business entities.',
      status: 'configured',
      lastSync: '10 mins ago'
    },
    {
      id: 'lusha',
      name: 'Lusha API',
      description: 'Find contact details for decision makers.',
      status: 'configured',
      lastSync: 'Never'
    }
  ]);

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Integrations</h1>
          <p className="text-gray-500 mt-1">Manage your API connections and credentials.</p>
        </div>

        <div className="space-y-4">
          {integrations.map(integration => (
            <div key={integration.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <Server className="text-gray-600" size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                  {integration.status === 'configured' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      <CheckCircle2 size={14} />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                      <XCircle size={14} />
                      Missing Credentials
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{integration.description}</p>
                
                <div className="mt-4 flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Shield size={14} />
                    <span>Last successful request: {integration.lastSync}</span>
                  </div>
                  
                  <button className="text-orange-600 font-medium hover:text-orange-700 flex items-center gap-1">
                    <Key size={14} />
                    Update API Key
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
