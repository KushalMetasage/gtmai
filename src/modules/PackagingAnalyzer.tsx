import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { createWorker } from 'tesseract.js';
import {
  Loader2, Upload, AlertCircle, CheckCircle2, 
  FileText, BarChart, AlertTriangle, Eye,
  ArrowRight, RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PackagingReview {
  id: string;
  front_image_url: string;
  back_image_url: string;
  scanned_text: string;
  claims: string[];
  readability_score: number;
  clutter_score: number;
  compliance_issues: Array<{
    type: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
}

function PackagingAnalyzer() {
  const { id: projectId } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<PackagingReview | null>(null);
  const [activeImage, setActiveImage] = useState<'front' | 'back'>('front');

  const onDrop = useCallback(async (acceptedFiles: File[], type: 'front' | 'back') => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload image to Supabase Storage
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const fileName = `${type}-${Date.now()}-${file.name}`;
      const { data: fileData, error: uploadError } = await supabase
        .storage
        .from('packaging-images')
        .upload(`${session.user.id}/${fileName}`, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('packaging-images')
        .getPublicUrl(`${session.user.id}/${fileName}`);

      // 3. Perform OCR
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      // 4. Send to edge function for analysis
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/packaging-analysis`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            imageType: type,
            imageUrl: publicUrl,
            scannedText: text
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setReview(data.review);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const { getRootProps: getFrontProps, getInputProps: getFrontInputProps } = useDropzone({
    onDrop: (files) => onDrop(files, 'front'),
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1
  });

  const { getRootProps: getBackProps, getInputProps: getBackInputProps } = useDropzone({
    onDrop: (files) => onDrop(files, 'back'),
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Packaging Analyzer</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setActiveImage('front')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  activeImage === 'front'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium mb-2">Front Label</h3>
                <div
                  {...getFrontProps()}
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer"
                >
                  <input {...getFrontInputProps()} />
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Drop front label image here
                  </p>
                </div>
              </button>

              <button
                onClick={() => setActiveImage('back')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  activeImage === 'back'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium mb-2">Back Label</h3>
                <div
                  {...getBackProps()}
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer"
                >
                  <input {...getBackInputProps()} />
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Drop back label image here
                  </p>
                </div>
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {loading && (
              <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <p className="text-sm text-blue-700">Analyzing packaging...</p>
              </div>
            )}
          </div>

          {review && (
            <div className="bg-white rounded-lg shadow divide-y">
              <div className="p-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  Detected Claims
                </h3>
                <div className="flex flex-wrap gap-2">
                  {review.claims.map((claim, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {claim}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-gray-500" />
                  Scores
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Readability</p>
                    <p className={`text-2xl font-semibold ${getScoreColor(review.readability_score)}`}>
                      {review.readability_score}%
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Visual Clarity</p>
                    <p className={`text-2xl font-semibold ${getScoreColor(100 - review.clutter_score)}`}>
                      {100 - review.clutter_score}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-gray-500" />
                  Compliance Issues
                </h3>
                <div className="space-y-3">
                  {review.compliance_issues.map((issue, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{issue.type}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          getSeverityColor(issue.severity)
                        }`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{issue.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-gray-500" />
                  Recommendations
                </h3>
                <div className="space-y-2">
                  {review.recommendations.map((recommendation, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <ArrowRight className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                      <p>{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {review && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Preview</h3>
                <button
                  onClick={() => setActiveImage(activeImage === 'front' ? 'back' : 'front')}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Switch View
                </button>
              </div>
              <img
                src={activeImage === 'front' ? review.front_image_url : review.back_image_url}
                alt={`${activeImage} label`}
                className="w-full rounded-lg shadow-sm"
              />
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Scanned Text</h4>
                <pre className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 whitespace-pre-wrap">
                  {review.scanned_text}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PackagingAnalyzer;