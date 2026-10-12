import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Play, Pause, Square, CheckCircle2, Activity, Search, Users } from 'lucide-react';
import { DiscoveryService } from '../services/discovery';

export default function SearchPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchParams, setSearchParams] = useState({
    country: 'UK',
    region: '',
    town: '',
    postcode: '',
    minRoofArea: 150,
    maxRoofArea: 0,
    roofMaterial: 'Metal',
    requireContacts: true
  });

  const [stats, setStats] = useState({
    discovered: 0,
    assessed: 0,
    passedRoof: 0,
    metalIdentified: 0,
    companiesMatched: 0,
    contactsFound: 0,
    qualified: 0,
    errors: 0
  });

  const handleStartSearch = async () => {
    setIsProcessing(true);
    
    try {
      const { data: job, error } = await supabase.from('property_search_jobs').insert([{
        parameters: searchParams,
        status: 'Processing'
      }]).select().single();

      if (error) throw error;
      
      const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || 'dummy';
      const voaApiKey = import.meta.env.VITE_VOA_API_KEY || 'dummy';

      const discoveryService = new DiscoveryService(googleApiKey, voaApiKey);
      
      // Run discovery in the background (conceptual for frontend)
      // In a real app, this would be an Edge Function call
      discoveryService.runDiscovery(job.id, searchParams, (newStats) => {
        setStats(prev => ({ ...prev, ...newStats }));
      }).finally(() => {
        setIsProcessing(false);
      });
      
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert('Failed to start search. Check console for details.');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find Commercial Properties</h1>
          <p className="text-gray-500 mt-1">Configure your search parameters to discover new prospects automatically.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Geographic Area</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                <select 
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  value={searchParams.country}
                  onChange={e => setSearchParams({...searchParams, country: e.target.value})}
                >
                  <option value="UK">United Kingdom</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Town / City</label>
                <input 
                  type="text" 
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  value={searchParams.town}
                  onChange={e => setSearchParams({...searchParams, town: e.target.value})}
                  placeholder="e.g. Manchester"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Postcode Area</label>
                <input 
                  type="text" 
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  value={searchParams.postcode}
                  onChange={e => setSearchParams({...searchParams, postcode: e.target.value})}
                  placeholder="e.g. M1"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Property Criteria</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min Roof Area (m²)</label>
                  <input 
                    type="number" 
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    value={searchParams.minRoofArea}
                    onChange={e => setSearchParams({...searchParams, minRoofArea: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Roof Area (m²)</label>
                  <input
                    type="number"
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    value={searchParams.maxRoofArea || ''}
                    onChange={e => setSearchParams({...searchParams, maxRoofArea: e.target.value ? parseInt(e.target.value) : 0})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Roof Material</label>
                <select 
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  value={searchParams.roofMaterial}
                  onChange={e => setSearchParams({...searchParams, roofMaterial: e.target.value})}
                >
                  <option value="Metal">Metal</option>
                  <option value="Any">Any Material</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="reqContacts"
                  className="rounded text-orange-600 focus:ring-orange-500 border-gray-300"
                  checked={searchParams.requireContacts}
                  onChange={e => setSearchParams({...searchParams, requireContacts: e.target.checked})}
                />
                <label htmlFor="reqContacts" className="text-sm text-gray-700">Require contact details</label>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t flex items-center justify-between">
            <button
              onClick={handleStartSearch}
              disabled={isProcessing}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm text-white transition-colors ${
                isProcessing ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 shadow-sm'
              }`}
            >
              {isProcessing ? <Activity className="animate-spin" size={18} /> : <Play size={18} />}
              {isProcessing ? 'Processing Search...' : 'FIND COMMERCIAL PROPERTIES'}
            </button>

            {isProcessing && (
              <div className="flex items-center gap-3">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
                  <Pause size={18} />
                </button>
                <button className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md">
                  <Square size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-6">Discovery Progress</h3>
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Discovered" value={stats.discovered} icon={Search} color="text-blue-600" bg="bg-blue-50" />
            <StatCard label="Roof Assessed" value={stats.assessed} icon={Activity} color="text-indigo-600" bg="bg-indigo-50" />
            <StatCard label="Qualified Size" value={stats.passedRoof} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
            <StatCard label="Final Prospects" value={stats.qualified} icon={Users} color="text-orange-600" bg="bg-orange-50" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <div className={`p-1.5 rounded-md ${bg}`}>
          <Icon size={14} className={color} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
