import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, Copy, Download, Bookmark, Share2, ChevronDown, ChevronUp,
  RefreshCw, Edit2, MessageSquare, Instagram, Briefcase, Dumbbell,
  ArrowLeftRight, Star, PencilLine
} from 'lucide-react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { supabase } from '../lib/supabase';

interface SegmentData {
  id: string;
  name: string;
  description: string;
  demographics: string[];
  psychographics: string[];
  behaviors: string[];
  channels: string[];
  positioning: string;
  tagline: string;
  messages: {
    whatsapp: string;
    instagram: string;
  };
  relevanceScore: number;
  icon: 'professional' | 'fitness';
}

interface FormData {
  productName: string;
  productForm: string;
  priceRange: string;
  ingredients: string;
  targetConsumer: string;
  channels: string[];
}

function SegmentationGenerator() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState<SegmentData[] | null>(null);
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());
  const [pinnedSegment, setPinnedSegment] = useState<string | null>(null);
  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    productName: '',
    productForm: '',
    priceRange: '',
    ingredients: '',
    targetConsumer: '',
    channels: [],
  });

  const channelOptions = [
    'Instagram',
    'WhatsApp',
    'Modern Trade',
    'General Trade',
    'E-commerce',
    'D2C'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChannelToggle = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/segmentation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            projectId,
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      // Add relevance scores and icons to segments
      const enhancedSegments = data.segments.map((segment: SegmentData, index: number) => ({
        ...segment,
        id: `segment-${index}`,
        relevanceScore: Math.round(Math.random() * 30 + 70), // Mock score between 70-100
        icon: index === 0 ? 'professional' : 'fitness'
      }));
      
      setSegments(enhancedSegments);
      setExpandedSegments(new Set([enhancedSegments[0].id])); // Expand first segment by default
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const regenerateSegment = async (segmentId: string) => {
    // Mock regeneration - in real app, call API
    alert('Regenerating segment...');
  };

  const regenerateMessages = async (segmentId: string, messageType: 'whatsapp' | 'instagram') => {
    // Mock message regeneration - in real app, call API
    alert(`Regenerating ${messageType} message...`);
  };

  const toggleSegmentExpansion = (id: string) => {
    setExpandedSegments(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const togglePinnedSegment = (id: string) => {
    setPinnedSegment(prev => prev === id ? null : id);
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setSelectedSegments([]);
  };

  const toggleSegmentSelection = (id: string) => {
    setSelectedSegments(prev => {
      if (prev.includes(id)) {
        return prev.filter(s => s !== id);
      }
      if (prev.length < 2) {
        return [...prev, id];
      }
      return [prev[1], id];
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const exportToCSV = (segments: SegmentData[]) => {
    const headers = ['Segment Name', 'Description', 'Demographics', 'Psychographics', 'Behaviors', 'Channels', 'Positioning', 'Tagline', 'WhatsApp Message', 'Instagram Message', 'Relevance Score'];
    const rows = segments.map(segment => [
      segment.name,
      segment.description,
      segment.demographics.join('; '),
      segment.psychographics.join('; '),
      segment.behaviors.join('; '),
      segment.channels.join('; '),
      segment.positioning,
      segment.tagline,
      segment.messages.whatsapp,
      segment.messages.instagram,
      segment.relevanceScore
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'segments.csv';
    link.click();
  };

  const exportToJSON = (segments: SegmentData[]) => {
    const jsonContent = JSON.stringify(segments, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'segments.json';
    link.click();
  };

  const getSegmentIcon = (type: 'professional' | 'fitness') => {
    switch (type) {
      case 'professional':
        return <Briefcase className="h-6 w-6 text-blue-600" />;
      case 'fitness':
        return <Dumbbell className="h-6 w-6 text-green-600" />;
      default:
        return null;
    }
  };

  const renderSegmentCard = (segment: SegmentData) => {
    const isExpanded = expandedSegments.has(segment.id);
    const isPinned = pinnedSegment === segment.id;
    const isSelected = selectedSegments.includes(segment.id);
    const isEditing = editingSegment === segment.id;

    return (
      <div 
        className={`bg-white rounded-lg shadow transition-all ${
          isPinned ? 'ring-2 ring-blue-500' : ''
        } ${isSelected ? 'ring-2 ring-green-500' : ''}`}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              {getSegmentIcon(segment.icon)}
              <div>
                <h3 className="text-lg font-semibold">{segment.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Relevance Score: {segment.relevanceScore}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {compareMode ? (
                <button
                  onClick={() => toggleSegmentSelection(segment.id)}
                  className={`p-2 rounded-full ${
                    isSelected ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <ArrowLeftRight className="h-5 w-5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => togglePinnedSegment(segment.id)}
                    className={`p-2 rounded-full ${
                      isPinned ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Bookmark className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => regenerateSegment(segment.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </>
              )}
              <button
                onClick={() => toggleSegmentExpansion(segment.id)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
              >
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <p className="text-gray-600 mb-4">{segment.description}</p>

          {isExpanded && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Demographics</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {segment.demographics.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Psychographics</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {segment.psychographics.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Positioning</h4>
                  {!isEditing && (
                    <button
                      onClick={() => setEditingSegment(segment.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      <PencilLine className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={segment.positioning}
                    onChange={(e) => {
                      // Handle positioning update
                    }}
                  />
                ) : (
                  <p className="text-gray-600">{segment.positioning}</p>
                )}
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Tagline</h4>
                <p className="text-gray-800 italic">"{segment.tagline}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-600" />
                      <h4 className="font-medium text-sm text-gray-700">WhatsApp Message</h4>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => regenerateMessages(segment.id, 'whatsapp')}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(segment.messages.whatsapp)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{segment.messages.whatsapp}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-gray-600" />
                      <h4 className="font-medium text-sm text-gray-700">Instagram Caption</h4>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => regenerateMessages(segment.id, 'instagram')}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(segment.messages.instagram)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{segment.messages.instagram}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Segmentation & Positioning Generator</h1>
        {segments && segments.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => exportToCSV(segments)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => exportToJSON(segments)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4" />
              Export JSON
            </button>
            <button
              onClick={toggleCompareMode}
              className={`flex items-center gap-2 px-4 py-2 text-sm ${
                compareMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              } rounded-lg`}
            >
              <ArrowLeftRight className="h-4 w-4" />
              {compareMode ? 'Exit Compare' : 'Compare Segments'}
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., VitaBoost Pro"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Form
                  </label>
                  <input
                    type="text"
                    name="productForm"
                    value={formData.productForm}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Ready-to-drink bottle"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <input
                    type="text"
                    name="priceRange"
                    value={formData.priceRange}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., ₹150-200"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Ingredients
                  </label>
                  <textarea
                    name="ingredients"
                    value={formData.ingredients}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Pea protein, MCT oil, vitamins"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Consumer (Optional)
                  </label>
                  <input
                    type="text"
                    name="targetConsumer"
                    value={formData.targetConsumer}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Urban fitness enthusiasts"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distribution Channels
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {channelOptions.map(channel => (
                      <button
                        key={channel}
                        type="button"
                        onClick={() => handleChannelToggle(channel)}
                        className={`px-4 py-2 rounded-lg border ${
                          formData.channels.includes(channel)
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {channel}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                        Generating Segments...
                      </>
                    ) : (
                      'Generate Segments'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {segments && segments.length > 0 && (
          <div className="space-y-6">
            {compareMode && selectedSegments.length === 2 ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Segment Comparison</h2>
                <div className="grid grid-cols-2 gap-4">
                  {selectedSegments.map(segmentId => {
                    const segment = segments.find(s => s.id === segmentId)!;
                    return renderSegmentCard(segment);
                  })}
                </div>
              </div>
            ) : (
              segments.map(segment => (
                <div key={segment.id} className="transform transition-transform hover:scale-102">
                  {renderSegmentCard(segment)}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SegmentationGenerator;