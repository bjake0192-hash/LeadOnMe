import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Download, Search, Filter, AlertCircle } from 'lucide-react';

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProspects();
  }, []);

  const fetchProspects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_company_matches (
            relationship,
            match_confidence,
            companies (
              *,
              contacts (*)
            )
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;

      // Flatten the nested data for the table
      const flattened = (data || []).map(p => {
        const match = p.property_company_matches?.[0];
        const company = match?.companies;
        const contact = company?.contacts?.[0];

        return {
          id: p.id,
          company_name: company?.name || 'Unknown Company',
          website: company?.website || '',
          address: p.address,
          postcode: p.postcode,
          region: p.region,
          estimated_roof_area: p.estimated_roof_area,
          roof_material: p.roof_material,
          roof_confidence: p.roof_material_confidence,
          qualification_status: p.qualification_status,
          contact_name: contact ? `${contact.first_name} ${contact.last_name}` : 'Not found',
          job_title: contact?.job_title || 'Unknown',
          email: contact?.email || 'Unknown',
          phone: contact?.phone || 'Unknown',
          town: '', // Would need to extract from address or store separately
          country: 'UK',
          verification_status: p.verification_status || 'Unverified',
          company_reg: company?.id.substring(0, 8), // Dummy reg for now
          property_source: p.data_source || 'VOA',
          roof_source: 'Google Solar',
          contact_source: 'Lusha',
          date_added: p.created_at,
          last_verified: p.updated_at
        };
      });
      
      setProspects(flattened);
    } catch (err) {
      console.error('Error fetching prospects:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === prospects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(prospects.map(p => p.id)));
    }
  };

  const exportToCSV = (selectedOnly = false) => {
    const dataToExport = selectedOnly 
      ? prospects.filter(p => selectedIds.has(p.id))
      : prospects;

    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Company Name', 
      'Property Address', 
      'Postcode', 
      'Town', 
      'Region', 
      'Country', 
      'Estimated Roof Area (m²)', 
      'Roof Material', 
      'Roof Classification Confidence', 
      'Roof Verification Status',
      'Contact Full Name', 
      'Contact Job Title', 
      'Contact Email', 
      'Contact Telephone', 
      'Company Website', 
      'Company Registration Number', 
      'Property Data Source',
      'Roof Data Source', 
      'Contact Data Source', 
      'Qualification Status',
      'Date Added', 
      'Last Verified'
    ];

    const csvRows = [
      headers.join(','),
      ...dataToExport.map(p => [
        `"${(p.company_name || '').replace(/"/g, '""')}"`,
        `"${(p.address || '').replace(/"/g, '""')}"`,
        `"${(p.postcode || '').replace(/"/g, '""')}"`,
        `"${(p.town || '').replace(/"/g, '""')}"`,
        `"${(p.region || '').replace(/"/g, '""')}"`,
        `"${(p.country || 'UK').replace(/"/g, '""')}"`,
        p.estimated_roof_area || 0,
        `"${(p.roof_material || 'Unknown').replace(/"/g, '""')}"`,
        p.roof_confidence || 0,
        `"${(p.verification_status || 'Unverified').replace(/"/g, '""')}"`,
        `"${(p.contact_name || '').replace(/"/g, '""')}"`,
        `"${(p.job_title || '').replace(/"/g, '""')}"`,
        `"${(p.email || '').replace(/"/g, '""')}"`,
        `"${(p.phone || '').replace(/"/g, '""')}"`,
        `"${(p.website || '').replace(/"/g, '""')}"`,
        `"${(p.company_reg || '').replace(/"/g, '""')}"`,
        `"${(p.property_source || 'Unknown').replace(/"/g, '""')}"`,
        `"${(p.roof_source || 'Unknown').replace(/"/g, '""')}"`,
        `"${(p.contact_source || 'Unknown').replace(/"/g, '""')}"`,
        `"${(p.qualification_status || 'Discovered').replace(/"/g, '""')}"`,
        `"${p.date_added || ''}"`,
        `"${p.last_verified || ''}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `openlead-qualified-prospects-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Qualified Prospects</h1>
          <p className="text-gray-500 mt-1">Review and export your matched leads.</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <button
              onClick={() => exportToCSV(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              EXPORT SELECTED ({selectedIds.size})
            </button>
          )}
          <button
            onClick={() => exportToCSV(false)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 shadow-sm"
          >
            <Download size={16} />
            EXPORT TO CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search companies, addresses, or contacts..." 
              className="w-full pl-9 pr-4 py-2 text-sm border-gray-300 rounded-lg focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={16} />
            Filters
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    checked={prospects.length > 0 && selectedIds.size === prospects.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">Company</th>
                <th className="px-4 py-3 font-medium text-gray-600">Website</th>
                <th className="px-4 py-3 font-medium text-gray-600">Address</th>
                <th className="px-4 py-3 font-medium text-gray-600">Postcode</th>
                <th className="px-4 py-3 font-medium text-gray-600">Roof (m²)</th>
                <th className="px-4 py-3 font-medium text-gray-600">Material</th>
                <th className="px-4 py-3 font-medium text-gray-600">Confidence</th>
                <th className="px-4 py-3 font-medium text-gray-600">Contact</th>
                <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500">Loading prospects...</td>
                </tr>
              ) : prospects.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="mb-2 text-gray-400" />
                      <p>No qualified prospects found.</p>
                      <p className="text-xs mt-1">Run a search to discover properties.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                prospects.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.company_name}</td>
                    <td className="px-4 py-3 text-blue-600 hover:underline"><a href={`https://${p.website}`} target="_blank" rel="noreferrer">{p.website}</a></td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]" title={p.address}>{p.address}</td>
                    <td className="px-4 py-3 text-gray-900">{p.postcode}</td>
                    <td className="px-4 py-3 text-gray-900">{p.estimated_roof_area || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        p.roof_material === 'Metal' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {p.roof_material}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.roof_confidence ? `${p.roof_confidence}%` : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900 font-medium">{p.contact_name}</div>
                      <div className="text-xs text-gray-500">{p.job_title}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.email}</td>
                    <td className="px-4 py-3 text-gray-600">{p.phone}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                        {p.qualification_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
