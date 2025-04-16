import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Loader2, Upload, FileText, AlertCircle, CheckCircle2,
  Lightbulb, Quote, TrendingUp, XCircle, ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Theme {
  name: string;
  description: string;
  confidence: number;
}

interface ResearchInsight {
  id: string;
  research_type: 'fgd' | 'di' | 'expert_interview';
  file_name: string;
  file_url: string;
  themes: Theme[];
  key_quotes: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  barriers: string[];
  drivers: string[];
  created_at: string;
}

function QualitativeResearch() {
  const { id: projectId } = useParams();
  const [loading, setLoading] = useState(false);
  const [researchType, setResearchType] = useState<'fgd' | 'di' | 'expert_interview'>('fgd');
  const [insights, setInsights] = useState<ResearchInsight | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fileContent = await file.text();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/qualitative-research`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            researchType,
            fileName: file.name,
            fileContent
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setInsights(data.insight);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, researchType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Qualitative Research Parser</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Research Type
              </label>
              <select
                value={researchType}
                onChange={(e) => setResearchType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="fgd">Focus Group Discussion</option>
                <option value="di">Depth Interview</option>
                <option value="expert_interview">Expert Interview</option>
              </select>
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className={`h-12 w-12 mx-auto mb-4 ${
                isDragActive ? 'text-blue-500' : 'text-gray-400'
              }`} />
              <p className="text-sm text-gray-600 mb-2">
                {isDragActive
                  ? 'Drop the file here'
                  : 'Drag & drop a file here, or click to select'
              }
              </p>
              <p className="text-xs text-gray-500">
                Supported formats: .txt, .docx, .pdf (max 10MB)
              </p>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          {loading && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <p className="text-sm text-gray-600">Analyzing research data...</p>
              </div>
            </div>
          )}
        </div>

        {insights && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <h3 className="font-medium">{insights.file_name}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  insights.sentiment === 'positive'
                    ? 'bg-green-100 text-green-800'
                    : insights.sentiment === 'negative'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {insights.sentiment} sentiment
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Key Themes
                  </h4>
                  <div className="space-y-3">
                    {insights.themes.map((theme, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium">{theme.name}</h5>
                          <span className="text-xs text-gray-500">
                            {Math.round(theme.confidence * 100)}% confidence
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{theme.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Quote className="h-4 w-4 text-blue-500" />
                    Key Quotes
                  </h4>
                  <div className="space-y-2">
                    {insights.key_quotes.map((quote, index) => (
                      <div
                        key={index}
                        className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 italic"
                      >
                        "{quote}"
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Barriers
                    </h4>
                    <div className="space-y-2">
                      {insights.barriers.map((barrier, index) => (
                        <div
                          key={index}
                          className="p-2 bg-red-50 rounded flex items-center gap-2"
                        >
                          <ArrowRight className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-700">{barrier}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Drivers
                    </h4>
                    <div className="space-y-2">
                      {insights.drivers.map((driver, index) => (
                        <div
                          key={index}
                          className="p-2 bg-green-50 rounded flex items-center gap-2"
                        >
                          <ArrowRight className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-700">{driver}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QualitativeResearch;