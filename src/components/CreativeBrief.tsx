import React, { useState } from 'react';
import {
  FileText, Download, RefreshCw, Clock, Users,
  MessageSquare, AlertTriangle, Eye, Palette
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CreativeBriefProps {
  projectId: string;
  selectedSegment: string | null;
  onClose: () => void;
}

interface Brief {
  id: string;
  version: number;
  objective: string;
  target_segment: {
    name: string;
    description: string;
    demographics: string[];
    psychographics: string[];
    behaviors: string[];
  };
  key_messages: string[];
  mandatory_claims: string[];
  tone_voice: {
    brand_tone: string;
    communication_dos: string[];
    communication_donts: string[];
  };
  visual_ideas: string[];
  created_at: string;
}

function CreativeBrief({ projectId, selectedSegment, onClose }: CreativeBriefProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [editing, setEditing] = useState(false);
  const [editedBrief, setEditedBrief] = useState<Brief | null>(null);

  const generateBrief = async () => {
    if (!selectedSegment) {
      setError('Please select a target segment first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/creative-brief`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            segmentId: selectedSegment
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setBrief(data.brief);
      setEditedBrief(data.brief);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | string[],
    subfield?: string
  ) => {
    if (!editedBrief) return;

    if (subfield) {
      setEditedBrief({
        ...editedBrief,
        [field]: {
          ...editedBrief[field as keyof Brief],
          [subfield]: value
        }
      });
    } else {
      setEditedBrief({
        ...editedBrief,
        [field]: value
      });
    }
  };

  const handleArrayChange = (
    field: string,
    index: number,
    value: string,
    subfield?: string
  ) => {
    if (!editedBrief) return;

    if (subfield) {
      const array = [...editedBrief[field as keyof Brief][subfield]];
      array[index] = value;
      handleInputChange(field, array, subfield);
    } else {
      const array = [...editedBrief[field as keyof Brief] as string[]];
      array[index] = value;
      handleInputChange(field, array);
    }
  };

  const saveBrief = async () => {
    if (!editedBrief) return;

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('creative_briefs')
        .update(editedBrief)
        .eq('id', editedBrief.id);

      if (updateError) throw updateError;

      setBrief(editedBrief);
      setEditing(false);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadBrief = () => {
    if (!brief) return;

    const content = `
CREATIVE BRIEF - v${brief.version}
Generated on ${new Date(brief.created_at).toLocaleDateString()}

OBJECTIVE
${brief.objective}

TARGET SEGMENT
${brief.target_segment.name}
${brief.target_segment.description}

Demographics:
${brief.target_segment.demographics.map(d => `- ${d}`).join('\n')}

Psychographics:
${brief.target_segment.psychographics.map(p => `- ${p}`).join('\n')}

Behaviors:
${brief.target_segment.behaviors.map(b => `- ${b}`).join('\n')}

KEY MESSAGES
${brief.key_messages.map(m => `- ${m}`).join('\n')}

MANDATORY CLAIMS
${brief.mandatory_claims.map(c => `- ${c}`).join('\n')}

TONE & VOICE
Brand Tone: ${brief.tone_voice.brand_tone}

Do's:
${brief.tone_voice.communication_dos.map(d => `- ${d}`).join('\n')}

Don'ts:
${brief.tone_voice.communication_donts.map(d => `- ${d}`).join('\n')}

VISUAL IDEAS
${brief.visual_ideas.map(v => `- ${v}`).join('\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `creative-brief-v${brief.version}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Creative Brief Generator</h2>
            </div>
            <div className="flex items-center gap-2">
              {brief && (
                <>
                  <button
                    onClick={downloadBrief}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-full"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-full"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!brief ? (
            <div className="text-center py-12">
              <button
                onClick={generateBrief}
                disabled={loading || !selectedSegment}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Generating Brief...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    Generate Brief
                  </>
                )}
              </button>
              {!selectedSegment && (
                <p className="text-sm text-gray-500 mt-3">
                  Please select a target segment first
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Version {brief.version}</span>
                </div>
                <span>{new Date(brief.created_at).toLocaleDateString()}</span>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Objective</h3>
                {editing ? (
                  <textarea
                    value={editedBrief?.objective}
                    onChange={(e) => handleInputChange('objective', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700">{brief.objective}</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  Target Segment
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">{brief.target_segment.name}</h4>
                  <p className="text-gray-600 mb-4">{brief.target_segment.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Demographics</h5>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {brief.target_segment.demographics.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Psychographics</h5>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {brief.target_segment.psychographics.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Behaviors</h5>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {brief.target_segment.behaviors.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gray-500" />
                  Key Messages
                </h3>
                {editing ? (
                  <div className="space-y-2">
                    {editedBrief?.key_messages.map((message, index) => (
                      <input
                        key={index}
                        type="text"
                        value={message}
                        onChange={(e) => handleArrayChange('key_messages', index, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {brief.key_messages.map((message, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-gray-700"
                      >
                        <span className="text-blue-500">•</span>
                        {message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Mandatory Claims</h3>
                {editing ? (
                  <div className="space-y-2">
                    {editedBrief?.mandatory_claims.map((claim, index) => (
                      <input
                        key={index}
                        type="text"
                        value={claim}
                        onChange={(e) => handleArrayChange('mandatory_claims', index, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {brief.mandatory_claims.map((claim, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {claim}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Palette className="h-5 w-5 text-gray-500" />
                  Tone & Voice
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Do's</h4>
                    {editing ? (
                      <div className="space-y-2">
                        {editedBrief?.tone_voice.communication_dos.map((item, index) => (
                          <input
                            key={index}
                            type="text"
                            value={item}
                            onChange={(e) => handleArrayChange('tone_voice', index, e.target.value, 'communication_dos')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {brief.tone_voice.communication_dos.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-gray-700"
                          >
                            <span className="text-green-500">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Don'ts</h4>
                    {editing ? (
                      <div className="space-y-2">
                        {editedBrief?.tone_voice.communication_donts.map((item, index) => (
                          <input
                            key={index}
                            type="text"
                            value={item}
                            onChange={(e) => handleArrayChange('tone_voice', index, e.target.value, 'communication_donts')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {brief.tone_voice.communication_donts.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-gray-700"
                          >
                            <span className="text-red-500">×</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Visual Ideas</h3>
                {editing ? (
                  <div className="space-y-2">
                    {editedBrief?.visual_ideas.map((idea, index) => (
                      <input
                        key={index}
                        type="text"
                        value={idea}
                        onChange={(e) => handleArrayChange('visual_ideas', index, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {brief.visual_ideas.map((idea, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-gray-700"
                      >
                        <span className="text-purple-500">•</span>
                        {idea}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {editing && (
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setEditedBrief(brief);
                      setEditing(false);
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveBrief}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreativeBrief;