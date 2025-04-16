import React, { useState, useEffect } from 'react';
import { AlertCircle, HelpCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FeasibilityData {
  city_tier: string;
  channel: string;
  feasibility_score: string;
  rationale: string;
}

interface ChannelMatrixProps {
  projectId: string;
}

function ChannelMatrix({ projectId }: ChannelMatrixProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FeasibilityData[]>([]);
  const [selectedCell, setSelectedCell] = useState<FeasibilityData | null>(null);

  const cityTiers = ['Tier-1', 'Tier-2', 'Tier-3'];
  const channels = ['E-commerce', 'Quick Commerce', 'Modern Trade', 'General Trade'];

  useEffect(() => {
    if (projectId && projectId !== 'new') {
      fetchFeasibilityData();
    }
  }, [projectId]);

  const fetchFeasibilityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/channel-feasibility`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId }),
        }
      );

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      setData(result.data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFeasibilityColor = (score: string) => {
    switch (score.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCellData = (tier: string, channel: string) => {
    return data.find(d => d.city_tier === tier && d.channel === channel);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading channel matrix</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Channel x Geography Matrix</h3>
          <button
            onClick={() => fetchFeasibilityData()}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh Analysis
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City Tier
                </th>
                {channels.map(channel => (
                  <th
                    key={channel}
                    className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {channel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cityTiers.map(tier => (
                <tr key={tier}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tier}
                  </td>
                  {channels.map(channel => {
                    const cellData = getCellData(tier, channel);
                    return (
                      <td
                        key={`${tier}-${channel}`}
                        className="px-6 py-4 whitespace-nowrap text-sm"
                      >
                        {cellData && (
                          <button
                            onClick={() => setSelectedCell(cellData)}
                            className="flex items-center gap-2 group"
                          >
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              getFeasibilityColor(cellData.feasibility_score)
                            }`}>
                              {cellData.feasibility_score}
                            </span>
                            <HelpCircle className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedCell && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">
                {selectedCell.channel} in {selectedCell.city_tier} Cities
              </h4>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-600">{selectedCell.rationale}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChannelMatrix;