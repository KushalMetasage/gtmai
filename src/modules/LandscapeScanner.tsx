import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Download, Bookmark, TrendingUp, DollarSign, Tag, Package, BarChart as ChartBar, ScatterChart as ScatterPlotIcon, FileImage } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

interface Competitor {
  competitor_name: string;
  product_name: string;
  price: number;
  pack_size: string;
  claims: string[];
  listing_url: string;
  platform: string;
}

interface MarketSummary {
  avgPrice: number;
  topClaims: { claim: string; count: number }[];
  priceRange: { min: number; max: number };
  platforms: { platform: string; count: number }[];
}

interface ClaimFrequency {
  claim: string;
  count: number;
}

interface ScatterDataPoint {
  x: number;
  y: number;
  name: string;
  packSize: string;
  price: number;
}

function LandscapeScanner() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    geography: 'IN',
    brand: ''
  });
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'list' | 'visual'>('list');
  const [scatterData, setScatterData] = useState<ScatterDataPoint[]>([]);
  const [claimFrequencies, setClaimFrequencies] = useState<ClaimFrequency[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (competitors.length > 0) {
      generateSummary(competitors);
      prepareVisualizationData(competitors);
    }
  }, [competitors]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    }
  };

  const prepareVisualizationData = (data: Competitor[]) => {
    // Prepare scatter plot data
    const scatter = data.map(comp => {
      // Extract numeric value from pack size (assuming format like "500ml" or "1kg")
      const sizeMatch = comp.pack_size.match(/(\d+)/);
      const numericSize = sizeMatch ? parseInt(sizeMatch[1]) : 0;

      return {
        x: numericSize,
        y: comp.price,
        name: comp.competitor_name,
        packSize: comp.pack_size,
        price: comp.price
      };
    });
    setScatterData(scatter);

    // Prepare claims frequency data
    const claimCounts: { [key: string]: number } = {};
    data.forEach(comp => {
      comp.claims.forEach(claim => {
        claimCounts[claim] = (claimCounts[claim] || 0) + 1;
      });
    });

    const frequencies = Object.entries(claimCounts)
      .map(([claim, count]) => ({ claim, count }))
      .sort((a, b) => b.count - a.count);
    setClaimFrequencies(frequencies);
  };

  const generateSummary = (data: Competitor[]) => {
    const prices = data.map(c => c.price);
    const claims = data.flatMap(c => c.claims);
    const platforms = data.map(c => c.platform);

    // Calculate claim frequencies
    const claimCounts = claims.reduce((acc, claim) => {
      acc[claim] = (acc[claim] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate platform frequencies
    const platformCounts = platforms.reduce((acc, platform) => {
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setSummary({
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      topClaims: Object.entries(claimCounts)
        .map(([claim, count]) => ({ claim, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      },
      platforms: Object.entries(platformCounts)
        .map(([platform, count]) => ({ platform, count }))
        .sort((a, b) => b.count - a.count)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-landscape`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setCompetitors(data.insights);
      navigate(`/project/${data.project.id}/landscape`);
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleBookmark = (competitorName: string) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(competitorName)) {
        next.delete(competitorName);
      } else {
        next.add(competitorName);
      }
      return next;
    });
  };

  const exportToCSV = () => {
    const headers = ['Competitor', 'Product', 'Price', 'Pack Size', 'Claims', 'Platform', 'URL'];
    const rows = competitors.map(c => [
      c.competitor_name,
      c.product_name,
      c.price,
      c.pack_size,
      c.claims.join('; '),
      c.platform,
      c.listing_url
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `market-landscape-${formData.category.toLowerCase().replace(/\s+/g, '-')}.csv`;
    link.click();
  };

  const downloadChart = (chartId: string) => {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) return;

    // Use html2canvas or similar library to capture chart
    alert('Chart download functionality to be implemented');
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'amazon':
        return <ShoppingCart className="h-5 w-5" />;
      case 'reddit':
        return <MessageSquare className="h-5 w-5" />;
      case 'youtube':
        return <Youtube className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const renderCompetitorsList = () => (
    <div className="space-y-4 overflow-y-auto max-h-[800px] pr-4">
      {competitors.map((competitor, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6 transition-all hover:shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-lg">{competitor.competitor_name}</h3>
              <p className="text-gray-600">{competitor.product_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleBookmark(competitor.competitor_name)}
                className={`p-1 rounded-full transition-colors ${
                  bookmarked.has(competitor.competitor_name)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Bookmark className="h-5 w-5" />
              </button>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                competitor.platform === 'Amazon'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}>
                {competitor.platform}
              </span>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Price</p>
              <p className="font-medium">₹{competitor.price}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pack Size</p>
              <p className="font-medium">{competitor.pack_size}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Claims</p>
            <div className="flex flex-wrap gap-2">
              {competitor.claims.map((claim, claimIndex) => (
                <span
                  key={claimIndex}
                  className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded"
                >
                  {claim}
                </span>
              ))}
            </div>
          </div>

          <a
            href={competitor.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 text-blue-600 hover:text-blue-800 text-sm inline-block"
          >
            View Listing →
          </a>
        </div>
      ))}
    </div>
  );

  const renderVisualSummary = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ScatterPlotIcon className="h-5 w-5 text-blue-600" />
            Price vs Pack Size Distribution
          </h3>
          <button
            onClick={() => downloadChart('priceScatter')}
            className="text-gray-500 hover:text-gray-700"
          >
            <FileImage className="h-5 w-5" />
          </button>
        </div>
        <div className="h-[400px]" id="priceScatter">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Pack Size" 
                unit="ml"
                label={{ value: 'Pack Size (ml)', position: 'bottom' }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Price" 
                unit="₹"
                label={{ value: 'Price (₹)', angle: -90, position: 'left' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 shadow-lg rounded-lg border">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-gray-600">Pack Size: {data.packSize}</p>
                        <p className="text-sm text-gray-600">Price: ₹{data.price}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                data={scatterData} 
                fill="#8884d8"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ChartBar className="h-5 w-5 text-blue-600" />
            Claims Distribution
          </h3>
          <button
            onClick={() => downloadChart('claimsChart')}
            className="text-gray-500 hover:text-gray-700"
          >
            <FileImage className="h-5 w-5" />
          </button>
        </div>
        <div className="h-[400px]" id="claimsChart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={claimFrequencies}
              margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="claim"
                angle={-45}
                textAnchor="end"
                interval={0}
                height={60}
              />
              <YAxis />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 shadow-lg rounded-lg border">
                        <p className="font-medium">{data.claim}</p>
                        <p className="text-sm text-gray-600">
                          Frequency: {data.count} products
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="#8884d8">
                {claimFrequencies.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${index * (360 / claimFrequencies.length)}, 70%, 60%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Market Landscape Scanner</h1>
        {competitors.length > 0 && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Plant-based protein drinks"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Geography
                </label>
                <select
                  name="geography"
                  value={formData.geography}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand (Optional)
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Raw Pressery"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Analyzing Market...
                  </>
                ) : (
                  'Start Market Analysis'
                )}
              </button>
            </form>
          </div>

          {summary && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Market Summary
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Price Analysis</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-500">Average</p>
                      <p className="font-semibold">₹{summary.avgPrice.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-500">Minimum</p>
                      <p className="font-semibold">₹{summary.priceRange.min}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-500">Maximum</p>
                      <p className="font-semibold">₹{summary.priceRange.max}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Tag className="h-4 w-4" />
                    <span className="text-sm">Top Claims</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {summary.topClaims.map(({ claim, count }) => (
                      <span
                        key={claim}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                      >
                        {claim} ({count})
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Package className="h-4 w-4" />
                    <span className="text-sm">Platform Distribution</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {summary.platforms.map(({ platform, count }) => (
                      <span
                        key={platform}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {platform} ({count})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {competitors.length > 0 && (
          <div>
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('list')}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${
                    activeTab === 'list'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setActiveTab('visual')}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${
                    activeTab === 'visual'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Visual Summary
                </button>
              </div>
            </div>

            {activeTab === 'list' ? renderCompetitorsList() : renderVisualSummary()}
          </div>
        )}
      </div>
    </div>
  );
}

export default LandscapeScanner;