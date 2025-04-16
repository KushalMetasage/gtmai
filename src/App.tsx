import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Rocket, Users, Target, Megaphone, Presentation as FilePresentation } from 'lucide-react';
import Sidebar from './components/Sidebar';
import LandscapeScanner from './modules/LandscapeScanner';
import SentimentMiner from './modules/SentimentMiner';
import SegmentationGenerator from './modules/SegmentationGenerator';
import PackagingAnalyzer from './modules/PackagingAnalyzer';
import GtmPlanCanvas from './modules/GtmPlanCanvas';
import DeckGenerator from './modules/DeckGenerator';
import BrandVision from './modules/BrandVision';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 p-8">
                  <Routes>
                    <Route path="/" element={<Navigate to="/project/new/landscape" replace />} />
                    <Route path="/project/:id/landscape" element={<LandscapeScanner />} />
                    <Route path="/project/:id/brand-vision" element={<BrandVision />} />
                    <Route path="/project/:id/sentiment" element={<SentimentMiner />} />
                    <Route path="/project/:id/segments" element={<SegmentationGenerator />} />
                    <Route path="/project/:id/packaging" element={<PackagingAnalyzer />} />
                    <Route path="/project/:id/gtm" element={<GtmPlanCanvas />} />
                    <Route path="/project/:id/deck" element={<DeckGenerator />} />
                  </Routes>
                </main>
              </div>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App