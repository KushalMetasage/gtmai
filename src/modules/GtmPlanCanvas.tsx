import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2, Download, Copy, FileText, FileImage, Search,
  Star, StickyNote, Lightbulb, ChevronDown, ChevronUp,
  Plus, Flag, MessageSquare, X, FileEdit, ArrowRight
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { supabase } from '../lib/supabase';
import ChannelMatrix from '../components/ChannelMatrix';
import CreativeBrief from '../components/CreativeBrief';

interface Strategy {
  id: string;
  title: string;
  description: string;
  channels: string[];
  metrics: string[];
  budget_allocation: string;
  notes?: string;
  isCritical?: boolean;
  subStrategies?: Strategy[];
}

interface GTMPlan {
  id: string;
  name: string;
  description: string;
  awareness_strategies: Strategy[];
  consideration_strategies: Strategy[];
  conversion_strategies: Strategy[];
  loyalty_strategies: Strategy[];
}

interface ProjectInsights {
  landscape: any[];
  sentiment: any[];
  segments: any[];
}

const FUNNEL_STAGES = {
  awareness: { title: 'Awareness', color: 'bg-blue-50' },
  consideration: { title: 'Consideration', color: 'bg-purple-50' },
  conversion: { title: 'Conversion', color: 'bg-green-50' },
  loyalty: { title: 'Loyalty', color: 'bg-orange-50' }
} as const;

type FunnelStage = keyof typeof FUNNEL_STAGES;

function GtmPlanCanvas() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<GTMPlan | null>(null);
  const [insights, setInsights] = useState<ProjectInsights | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAIRecommendation, setShowAIRecommendation] = useState(false);
  const [showCreativeBrief, setShowCreativeBrief] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [segments, setSegments] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );

  useEffect(() => {
    if (projectId && projectId !== 'new') {
      fetchSegments();
    }
  }, [projectId]);

  const fetchSegments = async () => {
    try {
      const { data, error } = await supabase
        .from('segments')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      setSegments(data || []);
    } catch (err) {
      console.error('Error fetching segments:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gtm-plan`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...(projectId !== 'new' ? { projectId } : {}),
            ...formData
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      const enhancedPlan = {
        ...data.plan,
        awareness_strategies: data.plan.awareness_strategies.map((s: Strategy, i: number) => ({
          ...s,
          id: `awareness-${i}`
        })),
        consideration_strategies: data.plan.consideration_strategies.map((s: Strategy, i: number) => ({
          ...s,
          id: `consideration-${i}`
        })),
        conversion_strategies: data.plan.conversion_strategies.map((s: Strategy, i: number) => ({
          ...s,
          id: `conversion-${i}`
        })),
        loyalty_strategies: data.plan.loyalty_strategies.map((s: Strategy, i: number) => ({
          ...s,
          id: `loyalty-${i}`
        }))
      };

      setPlan(enhancedPlan);
      setInsights(data.insights);
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId === overId) return;

    const [activeStage] = activeId.split('-');
    const [overStage] = overId.split('-');

    setPlan(prev => {
      if (!prev) return null;

      const activeStrategies = prev[`${activeStage}_strategies` as keyof GTMPlan] as Strategy[];
      const overStrategies = prev[`${overStage}_strategies` as keyof GTMPlan] as Strategy[];

      if (activeStage === overStage) {
        const oldIndex = activeStrategies.findIndex(s => s.id === activeId);
        const newIndex = overStrategies.findIndex(s => s.id === overId);

        const newStrategies = arrayMove(activeStrategies, oldIndex, newIndex);

        return {
          ...prev,
          [`${activeStage}_strategies`]: newStrategies
        };
      }

      const strategy = activeStrategies.find(s => s.id === activeId)!;
      const newActiveStrategies = activeStrategies.filter(s => s.id !== activeId);
      const newOverStrategies = [...overStrategies, { ...strategy, id: `${overStage}-${overStrategies.length}` }];

      return {
        ...prev,
        [`${activeStage}_strategies`]: newActiveStrategies,
        [`${overStage}_strategies`]: newOverStrategies
      };
    });

    setActiveId(null);
  };

  const toggleCardExpansion = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCritical = (stage: FunnelStage, strategyId: string) => {
    setPlan(prev => {
      if (!prev) return null;

      const strategies = prev[`${stage}_strategies` as keyof GTMPlan] as Strategy[];
      const updatedStrategies = strategies.map(s => 
        s.id === strategyId ? { ...s, isCritical: !s.isCritical } : s
      );

      return {
        ...prev,
        [`${stage}_strategies`]: updatedStrategies
      };
    });
  };

  const updateStrategyNote = (stage: FunnelStage, strategyId: string, note: string) => {
    setPlan(prev => {
      if (!prev) return null;

      const strategies = prev[`${stage}_strategies` as keyof GTMPlan] as Strategy[];
      const updatedStrategies = strategies.map(s => 
        s.id === strategyId ? { ...s, notes: note } : s
      );

      return {
        ...prev,
        [`${stage}_strategies`]: updatedStrategies
      };
    });
  };

  const addSubStrategy = (stage: FunnelStage, parentId: string) => {
    setPlan(prev => {
      if (!prev) return null;

      const strategies = prev[`${stage}_strategies` as keyof GTMPlan] as Strategy[];
      const updatedStrategies = strategies.map(s => {
        if (s.id === parentId) {
          return {
            ...s,
            subStrategies: [
              ...(s.subStrategies || []),
              {
                id: `${s.id}-sub-${Date.now()}`,
                title: 'New Sub-Strategy',
                description: 'Click to edit this sub-strategy',
                channels: [],
                metrics: [],
                budget_allocation: '0%'
              }
            ]
          };
        }
        return s;
      });

      return {
        ...prev,
        [`${stage}_strategies`]: updatedStrategies
      };
    });
  };

  const suggestStrategy = (stage: FunnelStage) => {
    const suggestion: Strategy = {
      id: `${stage}-${Date.now()}`,
      title: 'AI Suggested: Influencer Sampling Program',
      description: 'Based on your audience demographics and competitor analysis, we recommend implementing an influencer sampling program targeting micro-influencers in the health and wellness space.',
      channels: ['Instagram', 'TikTok'],
      metrics: ['Engagement Rate', 'Sample Requests', 'Conversion Rate'],
      budget_allocation: '15%'
    };

    setPlan(prev => {
      if (!prev) return null;

      return {
        ...prev,
        [`${stage}_strategies`]: [...prev[`${stage}_strategies` as keyof GTMPlan] as Strategy[], suggestion]
      };
    });

    setShowAIRecommendation(false);
  };

  const exportToCSV = () => {
    if (!plan) return;

    const headers = ['Stage', 'Strategy', 'Description', 'Channels', 'Metrics', 'Budget', 'Critical', 'Notes'];
    const rows = [
      ...plan.awareness_strategies.map(s => ['Awareness', ...formatStrategyRow(s)]),
      ...plan.consideration_strategies.map(s => ['Consideration', ...formatStrategyRow(s)]),
      ...plan.conversion_strategies.map(s => ['Conversion', ...formatStrategyRow(s)]),
      ...plan.loyalty_strategies.map(s => ['Loyalty', ...formatStrategyRow(s)])
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${plan.name.toLowerCase().replace(/\s+/g, '-')}-gtm-plan.csv`;
    link.click();
  };

  const formatStrategyRow = (strategy: Strategy) => [
    strategy.title,
    strategy.description,
    strategy.channels.join('; '),
    strategy.metrics.join('; '),
    strategy.budget_allocation,
    strategy.isCritical ? 'Yes' : 'No',
    strategy.notes || ''
  ];

  const renderStrategyCard = (strategy: Strategy, stage: FunnelStage) => {
    const isExpanded = expandedCards.has(strategy.id);

    return (
      <div 
        className={`bg-white rounded-lg shadow p-4 ${
          strategy.isCritical ? 'ring-2 ring-red-500' : ''
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h4 className="font-semibold">{strategy.title}</h4>
            <span className="text-sm text-blue-600 font-medium">{strategy.budget_allocation}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleCritical(stage, strategy.id)}
              className={`p-1 rounded-full ${
                strategy.isCritical ? 'text-red-600 bg-red-50' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Flag className="h-4 w-4" />
            </button>
            <button
              onClick={() => toggleCardExpansion(strategy.id)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>

        {isExpanded && (
          <>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Channels</p>
                <div className="flex flex-wrap gap-1">
                  {strategy.channels.map((channel, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {channel}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Key Metrics</p>
                <div className="flex flex-wrap gap-1">
                  {strategy.metrics.map((metric, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                    >
                      {metric}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Notes</p>
                  <button
                    onClick={() => {}}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </div>
                <textarea
                  value={strategy.notes || ''}
                  onChange={(e) => updateStrategyNote(stage, strategy.id, e.target.value)}
                  placeholder="Add notes..."
                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                  rows={2}
                />
              </div>

              {strategy.subStrategies && strategy.subStrategies.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-gray-700">Sub-Strategies</p>
                  {strategy.subStrategies.map((subStrategy) => (
                    <div key={subStrategy.id} className="pl-4 border-l-2 border-gray-200">
                      <h5 className="text-sm font-medium">{subStrategy.title}</h5>
                      <p className="text-xs text-gray-600">{subStrategy.description}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => addSubStrategy(stage, strategy.id)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Sub-Strategy
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderFunnelStage = (stage: FunnelStage) => {
    const strategies = plan?.[`${stage}_strategies` as keyof GTMPlan] as Strategy[] || [];
    const filteredStrategies = searchQuery
      ? strategies.filter(s => 
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.channels.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
          s.metrics.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : strategies;

    return (
      <div className={`${FUNNEL_STAGES[stage].color} p-4 rounded-lg`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{FUNNEL_STAGES[stage].title}</h3>
          <button
            onClick={() => suggestStrategy(stage)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <Lightbulb className="h-4 w-4" />
            Suggest
          </button>
        </div>

        <SortableContext
          items={filteredStrategies.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {filteredStrategies.map((strategy) => (
              <div key={strategy.id} className="transform transition-transform hover:scale-102">
                {renderStrategyCard(strategy, stage)}
              </div>
            ))}
          </div>
        </SortableContext>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">GTM Plan Canvas</h1>
        <div className="flex gap-2">
          {segments && segments.length > 0 && (
            <button
              onClick={() => setShowCreativeBrief(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FileEdit className="h-4 w-4" />
              Generate Brief
            </button>
          )}
          {plan && (
            <>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FileText className="h-4 w-4" />
                Export to Notion
              </button>
              <button
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FileImage className="h-4 w-4" />
                Export as PDF
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {!plan ? (
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Q2 2025 GTM Strategy"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of your GTM plan"
                    rows={3}
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
                      Generating Plan...
                    </>
                  ) : (
                    'Generate GTM Plan'
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            <div className="lg:col-span-4">
              <ChannelMatrix projectId={projectId} />
            </div>

            <div className="lg:col-span-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search strategies, channels, or metrics..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {(Object.keys(FUNNEL_STAGES) as FunnelStage[]).map((stage) => (
                <div key={stage}>
                  {renderFunnelStage(stage)}
                </div>
              ))}

              <DragOverlay>
                {activeId ? (
                  <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500 p-4">
                    <h4 className="font-semibold">
                      {plan[`${activeId.split('-')[0]}_strategies`].find(
                        (s: Strategy) => s.id === activeId
                      )?.title}
                    </h4>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        )}
      </div>

      {showAIRecommendation && (
        <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg p-4 border border-blue-200">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium">AI Recommendation</h4>
            </div>
            <button
              onClick={() => setShowAIRecommendation(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Based on your audience demographics and competitor analysis, we recommend adding an
            Influencer Sampling Program to your Awareness stage.
          </p>
          <button
            onClick={() => suggestStrategy('awareness')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Add Strategy
          </button>
        </div>
      )}

      {showCreativeBrief && (
        <CreativeBrief
          projectId={projectId}
          selectedSegment={selectedSegmentId}
          onClose={() => setShowCreativeBrief(false)}
        />
      )}
    </div>
  );
}

export default GtmPlanCanvas;