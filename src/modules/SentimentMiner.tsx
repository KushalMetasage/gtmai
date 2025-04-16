import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, MessageSquare, ShoppingCart, Youtube, ChevronDown, ChevronUp, 
  Download, Filter, PieChart, Bookmark, RefreshCw, FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import QualitativeResearch from './QualitativeResearch';

interface SentimentInsight {
  id: string;
  insight_type: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  content: string;
  keywords: string[];
  source?: {
    source_type: 'amazon' | 'reddit' | 'youtube';
    source_url: string;
    source_text: string;
  };
}

interface SentimentSummary {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  topKeywords: { keyword: string; count: number }[];
  sourceBreakdown: { source: string; count: number }[];
}

function SentimentMiner() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'social' | 'research'>('social');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<SentimentInsight[]>([]);
  const [summary, setSummary] = useState<SentimentSummary | null>(null);
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());
  const [bookmarkedInsights, setBookmarkedInsights] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    sentiment: 'all',
    source: 'all',
    keyword: ''
  });
  const [formData, setFormData] = useState({
    category: '',
    keywords: ''
  });

  useEffect(() => {
    if (insights.length > 0) {
      generateSummary(insights);
    }
  }, [insights]);

  const generateSummary = (data: SentimentInsight[]) => {
    const sentimentCounts = data.reduce((acc, insight) => {
      acc[insight.sentiment] = (acc[insight.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const keywords = data.flatMap(i => i.keywords);
    const keywordCounts = keywords.reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sources = data.map(i => i.source?.source_type || 'unknown');
    const sourceCounts = sources.reduce((acc, source) => {
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setSummary({
      total: data.length,
      positive: sentimentCounts.positive || 0,
      negative: sentimentCounts.negative || 0,
      neutral: sentimentCounts.neutral || 0,
      topKeywords: Object.entries(keywordCounts)
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      sourceBreakdown: Object.entries(sourceCounts)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      let finalProjectId = projectId;

      // If projectId is 'new', create a new project first
      if (projectId === 'new') {
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            category: formData.category,
            geography: 'global', // Default value
            brand: null // Optional
          })
          .select()
          .single();

        if (projectError) throw projectError;
        finalProjectId = newProject.id;
        
        // Redirect to the new project's URL
        navigate(`/project/${finalProjectId}/sentiment`, { replace: true });
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/consumer-sentiment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category: formData.category,
            keywords: formData.keywords.split(',').map(k => k.trim()),
            projectId: finalProjectId
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setInsights(data.insights);
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.name === 'sentiment' || e.target.name === 'source') {
      setFilters({
        ...filters,
        [e.target.name]: e.target.value
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const toggleQuote = (id: string) => {
    setExpandedQuotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedInsights(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exportToCSV = () => {
    const headers = ['Type', 'Sentiment', 'Content', 'Keywords', 'Source', 'URL', 'Quote'];
    const rows = insights.map(insight => [
      insight.insight_type,
      insight.sentiment,
      insight.content,
      insight.keywords.join('; '),
      insight.source?.source_type || '',
      insight.source?.source_url || '',
      insight.source?.source_text || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sentiment-analysis-${formData.category.toLowerCase().replace(/\s+/g, '-')}.csv`;
    link.click();
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

  const highlightKeywords = (text: string, keywords: string[]) => {
    let highlightedText = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-100 rounded px-1">$1</mark>');
    });
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  const filteredInsights = insights.filter(insight => {
    const matchesSentiment = filters.sentiment === 'all' || insight.sentiment === filters.sentiment;
    const matchesSource = filters.source === 'all' || insight.source?.source_type === filters.source;
    const matchesKeyword = !filters.keyword || insight.keywords.some(k => 
      k.toLowerCase().includes(filters.keyword.toLowerCase())
    );
    return matchesSentiment && matchesSource && matchesKeyword;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Consumer Sentiment Analysis</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('social')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeView === 'social'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Social Listening
          </button>
          <button
            onClick={() => setActiveView('research')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeView === 'research'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FileText className="h-4 w-4 inline-block mr-2" />
            Qualitative Research
          </button>
        </div>
      </div>

      {activeView === 'social' ? (
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
                    Keywords or Pain Points (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., taste, price, packaging"
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
                      Analyzing Sentiment...
                    </>
                  ) : (
                    'Start Sentiment Analysis'
                  )}
                </button>
              </form>
            </div>

            {summary && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  Sentiment Overview
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-sm text-green-600">Positive</p>
                      <p className="font-semibold text-green-700">{summary.positive} ({Math.round(summary.positive / summary.total * 100)}%)</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <p className="text-sm text-red-600">Negative</p>
                      <p className="font-semibold text-red-700">{summary.negative} ({Math.round(summary.negative / summary.total * 100)}%)</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Neutral</p>
                      <p className="font-semibold text-gray-700">{summary.neutral} ({Math.round(summary.neutral / summary.total * 100)}%)</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Top Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {summary.topKeywords.map(({ keyword, count }) => (
                        <span
                          key={keyword}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                        >
                          {keyword} ({count})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Source Distribution</p>
                    <div className="flex flex-wrap gap-2">
                      {summary.sourceBreakdown.map(({ source, count }) => (
                        <span
                          key={source}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-1"
                        >
                          {getSourceIcon(source)}
                          {source} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {insights.length > 0 && (
            <div>
              <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Sentiment</label>
                    <select
                      name="sentiment"
                      value={filters.sentiment}
                      onChange={handleInputChange}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All</option>
                      <option value="positive">Positive</option>
                      <option value="negative">Negative</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Source</label>
                    <select
                      name="source"
                      value={filters.source}
                      onChange={handleInputChange}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All</option>
                      <option value="amazon">Amazon</option>
                      <option value="reddit">Reddit</option>
                      <option value="youtube">YouTube</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Keyword</label>
                    <input
                      type="text"
                      value={filters.keyword}
                      onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                      placeholder="Filter by keyword"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[800px] pr-4">
                {filteredInsights.map((insight, index) => (
                  <div key={index} className="bg-white rounded-lg shadow p-6 transition-all hover:shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          insight.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                          insight.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {insight.sentiment}
                        </span>
                        <span className="text-sm text-gray-500 capitalize">
                          {insight.insight_type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleBookmark(insight.id)}
                          className={`p-1 rounded-full transition-colors ${
                            bookmarkedInsights.has(insight.id)
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <Bookmark className="h-5 w-5" />
                        </button>
                        {insight.source && (
                          <div className="flex items-center text-gray-500">
                            {getSourceIcon(insight.source.source_type)}
                            <span className="ml-1 text-sm capitalize">
                              {insight.source.source_type}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-800 mb-4">{insight.content}</p>
                    
                    {insight.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {insight.keywords.map((keyword, keywordIndex) => (
                          <span
                            key={keywordIndex}
                            className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}

                    {insight.source && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                          <span>Source Quote</span>
                          <button
                            onClick={() => toggleQuote(insight.id)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            {expandedQuotes.has(insight.id) ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                Show More
                              </>
                            )}
                          </button>
                        </div>
                        <div className={`text-sm text-gray-600 ${expandedQuotes.has(insight.id) ? '' : 'line-clamp-2'}`}>
                          <p className="italic">
                            {highlightKeywords(insight.source.source_text, insight.keywords)}
                          </p>
                        </div>
                        <a
                          href={insight.source.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                        >
                          View Source →
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <RefreshCw className="h-4 w-4" />
                  Re-run Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <QualitativeResearch />
      )}
    </div>
  );
}

export default SentimentMiner;