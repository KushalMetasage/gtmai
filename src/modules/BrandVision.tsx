import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Save, AlertCircle, CheckCircle, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BrandVision {
  id: string;
  mission: string;
  tone: string;
  communication_dos: string[];
  communication_donts: string[];
}

function BrandVision() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vision, setVision] = useState<BrandVision | null>(null);
  const [formData, setFormData] = useState({
    mission: '',
    tone: '',
    newDo: '',
    newDont: ''
  });
  const [communicationDos, setCommunicationDos] = useState<string[]>([]);
  const [communicationDonts, setCommunicationDonts] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (projectId && projectId !== 'new') {
      fetchBrandVision();
    }
  }, [projectId]);

  const fetchBrandVision = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brand_vision')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) throw error;

      if (data) {
        setVision(data);
        setFormData({
          mission: data.mission,
          tone: data.tone,
          newDo: '',
          newDont: ''
        });
        setCommunicationDos(data.communication_dos || []);
        setCommunicationDonts(data.communication_donts || []);
      }
    } catch (error) {
      console.error('Error fetching brand vision:', error);
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

  const addCommunicationItem = (type: 'do' | 'dont') => {
    const value = type === 'do' ? formData.newDo.trim() : formData.newDont.trim();
    if (!value) return;

    if (type === 'do') {
      setCommunicationDos([...communicationDos, value]);
      setFormData({ ...formData, newDo: '' });
    } else {
      setCommunicationDonts([...communicationDonts, value]);
      setFormData({ ...formData, newDont: '' });
    }
  };

  const removeCommunicationItem = (type: 'do' | 'dont', index: number) => {
    if (type === 'do') {
      setCommunicationDos(communicationDos.filter((_, i) => i !== index));
    } else {
      setCommunicationDonts(communicationDonts.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      let finalProjectId = projectId;

      // If this is a new project, create it first
      if (projectId === 'new') {
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert([{
            user_id: session.user.id,
            category: 'default', // You might want to make this configurable
            geography: 'global', // You might want to make this configurable
          }])
          .select()
          .single();

        if (projectError) throw projectError;
        if (!newProject) throw new Error('Failed to create new project');
        
        finalProjectId = newProject.id;
      }

      const visionData = {
        project_id: finalProjectId,
        user_id: session.user.id,
        mission: formData.mission,
        tone: formData.tone,
        communication_dos: communicationDos,
        communication_donts: communicationDonts
      };

      const { error } = vision
        ? await supabase
            .from('brand_vision')
            .update(visionData)
            .eq('id', vision.id)
        : await supabase
            .from('brand_vision')
            .insert([visionData]);

      if (error) throw error;

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);

      // If this was a new project, navigate to the landscape page with the new project ID
      if (projectId === 'new') {
        navigate(`/project/${finalProjectId}/landscape`);
      }
    } catch (error) {
      console.error('Error saving brand vision:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Brand Vision</h1>
        {saveStatus && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            saveStatus === 'success' 
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {saveStatus === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">
              {saveStatus === 'success' ? 'Changes saved' : 'Error saving changes'}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block mb-4">
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Brand Mission & Long-term Goal
            </span>
            <textarea
              name="mission"
              value={formData.mission}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your brand's mission and long-term goal in 1–2 sentences"
              rows={3}
              required
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Brand Tone
            </span>
            <input
              type="text"
              name="tone"
              value={formData.tone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., fun, aspirational, premium"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Communication Do's</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  name="newDo"
                  value={formData.newDo}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a communication do"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCommunicationItem('do'))}
                />
                <button
                  type="button"
                  onClick={() => addCommunicationItem('do')}
                  className="p-2 text-blue-600 hover:text-blue-800"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <ul className="space-y-2">
                {communicationDos.map((item, index) => (
                  <li 
                    key={index}
                    className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg"
                  >
                    <span className="text-blue-700">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeCommunicationItem('do', index)}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Communication Don'ts</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  name="newDont"
                  value={formData.newDont}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a communication don't"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCommunicationItem('dont'))}
                />
                <button
                  type="button"
                  onClick={() => addCommunicationItem('dont')}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <ul className="space-y-2">
                {communicationDonts.map((item, index) => (
                  <li 
                    key={index}
                    className="flex items-center justify-between px-3 py-2 bg-red-50 rounded-lg"
                  >
                    <span className="text-red-700">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeCommunicationItem('dont', index)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Vision
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BrandVision;