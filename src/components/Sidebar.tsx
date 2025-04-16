import React, { useState, useEffect } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { 
  Rocket, Users, Target, Megaphone, Presentation as FilePresentation,
  ChevronDown, CheckCircle2, Plus, Copy, ArrowLeft, Lightbulb,
  Settings, MoreHorizontal, Package
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Project {
  id: string;
  category: string;
  geography: string;
  brand: string | null;
  created_at: string;
}

interface ModuleProgress {
  landscape: boolean;
  brand_vision: boolean;
  sentiment: boolean;
  segments: boolean;
  gtm: boolean;
  deck: boolean;
}

const menuItems = [
  { path: 'landscape', icon: Rocket, label: 'Market Landscape' },
  { path: 'brand-vision', icon: Lightbulb, label: 'Brand Vision' },
  { path: 'sentiment', icon: Users, label: 'Consumer Sentiment' },
  { path: 'segments', icon: Target, label: 'Segmentation' },
  { path: 'packaging', icon: Package, label: 'Packaging Analyzer' },
  { path: 'gtm', icon: Megaphone, label: 'GTM Plan' },
  { path: 'deck', icon: FilePresentation, label: 'Generate Deck' },
];

function Sidebar() {
  const location = useLocation();
  const { id: projectId } = useParams();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [progress, setProgress] = useState<ModuleProgress>({
    landscape: false,
    brand_vision: false,
    sentiment: false,
    segments: false,
    gtm: false,
    deck: false
  });

  useEffect(() => {
    if (projectId && projectId !== 'new') {
      fetchProjectDetails();
      checkModuleProgress();
    }
    fetchProjects();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setCurrentProject(project);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data: projectList, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(projectList);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const checkModuleProgress = async () => {
    if (!projectId || projectId === 'new') return;
    
    try {
      // Check landscape insights
      const { data: landscape } = await supabase
        .from('landscape_insights')
        .select('id')
        .eq('project_id', projectId)
        .limit(1);

      // Check brand vision
      const { data: brandVision } = await supabase
        .from('brand_vision')
        .select('id')
        .eq('project_id', projectId)
        .limit(1);

      // Check sentiment insights
      const { data: sentiment } = await supabase
        .from('consumer_sentiment')
        .select('id')
        .eq('project_id', projectId)
        .limit(1);

      // Check segments
      const { data: segments } = await supabase
        .from('segments')
        .select('id')
        .eq('project_id', projectId)
        .limit(1);

      // Check GTM plan
      const { data: gtm } = await supabase
        .from('gtm_plans')
        .select('id')
        .eq('project_id', projectId)
        .limit(1);

      setProgress({
        landscape: landscape && landscape.length > 0,
        brand_vision: brandVision && brandVision.length > 0,
        sentiment: sentiment && sentiment.length > 0,
        segments: segments && segments.length > 0,
        gtm: gtm && gtm.length > 0,
        deck: false
      });
    } catch (error) {
      console.error('Error checking progress:', error);
    }
  };

  const duplicateProject = async () => {
    if (!currentProject) return;

    try {
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert([{
          category: currentProject.category,
          geography: currentProject.geography,
          brand: currentProject.brand,
        }])
        .select()
        .single();

      if (projectError) throw projectError;

      // Redirect to the new project
      window.location.href = `/project/${newProject.id}/landscape`;
    } catch (error) {
      console.error('Error duplicating project:', error);
      alert('Failed to duplicate project');
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-6">
          <Rocket className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold">GoToMarket.AI</h1>
        </div>

        {currentProject ? (
          <div className="relative">
            <button
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="w-full px-4 py-2 bg-gray-50 rounded-lg text-left flex items-center justify-between group hover:bg-gray-100"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentProject.category}
                </p>
                <p className="text-xs text-gray-500">
                  {currentProject.geography} {currentProject.brand && `• ${currentProject.brand}`}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            </button>

            {showProjectMenu && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <Link
                  to="/project/new/landscape"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Link>
                <button
                  onClick={duplicateProject}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Project
                </button>
                <Link
                  to="/projects"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  All Projects
                </Link>
                <button
                  onClick={() => {}}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Project Settings
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 font-medium">Start Here</p>
            <p className="text-xs text-blue-600">Create your first project</p>
          </div>
        )}
      </div>
      
      <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
        {menuItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname.includes(path);
          const isComplete = progress[path.replace('-', '_') as keyof ModuleProgress];

          return (
            <Link
              key={path}
              to={`/project/${projectId || 'new'}/${path}`}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors relative ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium flex-1">{label}</span>
              {isComplete && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {projects.length > 0 && (
        <div className="p-6 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-3">Recent Projects</p>
          <div className="space-y-2">
            {projects.slice(0, 3).map(project => (
              <Link
                key={project.id}
                to={`/project/${project.id}/landscape`}
                className="block px-3 py-2 rounded hover:bg-gray-50"
              >
                <p className="text-sm font-medium text-gray-900 truncate">
                  {project.category}
                </p>
                <p className="text-xs text-gray-500">
                  {project.geography} {project.brand && `• ${project.brand}`}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;