import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  Plus,
  Terminal,
  Code, 
  Globe, 
  Monitor,
  Package,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  GitBranch,
  Calendar,
  Zap,
  Database,
  Cpu,
  Layers,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

import { NotificationAlert } from './components/blocks/notification-alert/notification-alert';
import { SettingsDialog } from './components/blocks/settings-dialog/settings-dialog';
import { CreateProjectDialog } from './components/blocks/create-project-dialog/create-project-dialog';
import { ProjectCard } from './components/blocks/project-card/project-card';
import { ProjectDetailsSidebar } from './components/blocks/project-details-sidebar/project-details-sidebar';
import { ProjectStructureView } from './components/blocks/project-structure-view/project-structure-view';
import { ProjectContextMenu } from './components/blocks/project-context-menu/project-context-menu';
import { CategorySidebar } from './components/blocks/category-sidebar/category-sidebar';
import { SearchFilterBar } from './components/blocks/search-filter-bar/search-filter-bar';
import { HeaderBar } from './components/blocks/header-bar/header-bar';
import { EmptyState } from './components/blocks/empty-state/empty-state';

// Tauri API - In real app, import from '@tauri-apps/api'
const invoke = window.__TAURI__?.invoke || ((cmd, args) => {
  console.log('Tauri command:', cmd, args);
  return Promise.resolve(mockData[cmd] || {});
});

// Mock data for development
const mockData = {
  initialize_workspace: '/home/user/dev',
  scan_projects: {
    'desktop-apps': [
      { 
        name: 'project-manager', 
        project_type: 'tauri', 
        last_modified: '2024-01-15 14:30:00',
        size: 1024000,
        files_count: 45,
        path: '/home/user/dev/desktop-apps/project-manager',
        git_status: 'clean',
        starred: true
      },
      { 
        name: 'media-player', 
        project_type: 'electron', 
        last_modified: '2024-01-12 10:15:00',
        size: 2048000,
        files_count: 78,
        path: '/home/user/dev/desktop-apps/media-player',
        git_status: 'modified',
        starred: false
      },
    ],
    'web-apps': [
      { 
        name: 'portfolio-site', 
        project_type: 'next', 
        last_modified: '2024-01-14 16:45:00',
        size: 512000,
        files_count: 32,
        path: '/home/user/dev/web-apps/portfolio-site',
        git_status: 'ahead',
        starred: true
      },
      { 
        name: 'ecommerce-platform', 
        project_type: 'react', 
        last_modified: '2024-01-10 09:20:00',
        size: 3072000,
        files_count: 156,
        path: '/home/user/dev/web-apps/ecommerce-platform',
        git_status: 'clean',
        starred: false
      },
    ],
    'cli-apps': [
      { 
        name: 'file-organizer', 
        project_type: 'rust', 
        last_modified: '2024-01-13 11:30:00',
        size: 256000,
        files_count: 12,
        path: '/home/user/dev/cli-apps/file-organizer',
        git_status: 'clean',
        starred: false
      },
      { 
        name: 'build-tool', 
        project_type: 'node', 
        last_modified: '2024-01-11 15:45:00',
        size: 768000,
        files_count: 34,
        path: '/home/user/dev/cli-apps/build-tool',
        git_status: 'behind',
        starred: true
      },
    ],
    'other': [
      { 
        name: 'research-notes', 
        project_type: 'markdown', 
        last_modified: '2024-01-09 08:15:00',
        size: 128000,
        files_count: 8,
        path: '/home/user/dev/other/research-notes',
        git_status: 'clean',
        starred: false
      },
    ]
  },
  get_project_structure: {
    'src': {
      'main.rs': 'file',
      'lib.rs': 'file',
      'components': {
        'ui.rs': 'file',
        'utils.rs': 'file'
      }
    },
    'target': {
      'debug': {
        'deps': {}
      }
    },
    'Cargo.toml': 'file',
    'README.md': 'file',
    '.gitignore': 'file'
  }
};

const ProjectTypeIcon = ({ type }) => {
  const icons = {
    'tauri': <Monitor className="w-4 h-4 text-purple-500" />,
    'electron': <Monitor className="w-4 h-4 text-blue-500" />,
    'next': <Globe className="w-4 h-4 text-black dark:text-white" />,
    'react': <Globe className="w-4 h-4 text-blue-400" />,
    'rust': <Zap className="w-4 h-4 text-orange-500" />,
    'node': <Terminal className="w-4 h-4 text-green-500" />,
    'python': <Database className="w-4 h-4 text-yellow-500" />,
    'go': <Cpu className="w-4 h-4 text-cyan-500" />,
    'markdown': <File className="w-4 h-4 text-gray-500" />,
    'unknown': <Package className="w-4 h-4 text-gray-400" />
  };
  return icons[type] || icons.unknown;
};

const GitStatusIndicator = ({ status }) => {
  const statusConfig = {
    'clean': { color: 'text-green-500', label: 'Clean' },
    'modified': { color: 'text-yellow-500', label: 'Modified' },
    'ahead': { color: 'text-blue-500', label: 'Ahead' },
    'behind': { color: 'text-red-500', label: 'Behind' },
    'diverged': { color: 'text-purple-500', label: 'Diverged' }
  };

  const config = statusConfig[status] || statusConfig.clean;

  return (
    <div className="flex items-center gap-1">
      <GitBranch className={`w-3 h-3 ${config.color}`} />
      <span className={`text-xs ${config.color}`}>{config.label}</span>
    </div>
  );
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ProjectManager = () => {
  const [projects, setProjects] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectStructure, setProjectStructure] = useState({});
  const [expandedNodes, setExpandedNodes] = useState({});
  const [contextMenu, setContextMenu] = useState({ isOpen: false, position: { x: 0, y: 0 }, project: null, category: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({ types: ['all'], starredOnly: false });
  const [baseDir, setBaseDir] = useState('');
  const [notification, setNotification] = useState(null);

  const categories = [
    { key: 'desktop-apps', label: 'Desktop Apps', icon: <Monitor className="w-5 h-5" /> },
    { key: 'web-apps', label: 'Web Apps', icon: <Globe className="w-5 h-5" /> },
    { key: 'cli-apps', label: 'CLI Apps', icon: <Terminal className="w-5 h-5" /> },
    { key: 'other', label: 'Other', icon: <Package className="w-5 h-5" /> },
  ];

  useEffect(() => {
    initializeApp();
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      const workspaceDir = await invoke('initialize_workspace');
      setBaseDir(workspaceDir);
      await refreshProjects();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      showNotification('Failed to initialize workspace', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProjects = async () => {
    try {
      const projectsData = await invoke('scan_projects', { baseDir });
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to scan projects:', error);
      showNotification('Failed to scan projects', 'error');
    }
  };

  const toggleNode = (path) => {
    setExpandedNodes(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleProjectSelect = async (project, category) => {
    setSelectedProject({ ...project, category });
    setSelectedCategory(category);
    
    try {
      const structure = await invoke('get_project_structure', { projectPath: project.path });
      setProjectStructure(structure);
    } catch (error) {
      console.error('Failed to get project structure:', error);
      showNotification('Failed to load project structure', 'error');
    }
  };

  const handleContextMenu = (e, project, category) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      project,
      category
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, project: null, category: null });
  };

  const handleCreateProject = async (category, name, type) => {
    try {
      await invoke('create_project', { baseDir, category, name, projectType: type });
      await refreshProjects();
      showNotification(`Project "${name}" created successfully`, 'success');
    } catch (error) {
      console.error('Failed to create project:', error);
      showNotification('Failed to create project', 'error');
    }
  };

  const handleToggleStar = async (project, category) => {
    try {
      await invoke('toggle_project_star', { projectPath: project.path });
      await refreshProjects();
      showNotification(`Project ${project.starred ? 'unstarred' : 'starred'}`, 'success');
    } catch (error) {
      console.error('Failed to toggle star:', error);
      showNotification('Failed to update project', 'error');
      }
  };

  const filterProjects = (projectsData) => {
    if (!projectsData) return {};
    
    const filtered = {};
    
    Object.entries(projectsData).forEach(([category, projects]) => {
      const filteredProjects = projects.filter(project => {
        // Search filter
        if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        // Type filter
        if (!filters.types.includes('all') && !filters.types.includes(project.project_type)) {
          return false;
        }
        
        // Starred filter
        if (filters.starredOnly && !project.starred) {
          return false;
        }
        
        return true;
      });
      
      if (filteredProjects.length > 0) {
        filtered[category] = filteredProjects;
      }
    });
    
    return filtered;
  };

  const filteredProjects = filterProjects(projects);

  const getTotalProjectCount = () => {
    return Object.values(projects).reduce((total, categoryProjects) => 
      total + categoryProjects.length, 0
    );
  };

  const getStarredProjectCount = () => {
    return Object.values(projects).reduce((total, categoryProjects) => 
      total + categoryProjects.filter(p => p.starred).length, 0
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <HeaderBar
        baseDir={baseDir}
        totalProjects={getTotalProjectCount()}
        starredProjects={getStarredProjectCount()}
        onNewProject={() => setShowCreateModal(true)}
        onRefresh={refreshProjects}
      />

      {/* Search and Filters */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <CategorySidebar
          categories={categories}
          filteredProjects={filteredProjects}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {selectedCategory ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {categories.find(c => c.key === selectedCategory)?.label}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredProjects[selectedCategory]?.length || 0} projects
                </span>
              </div>

              {filteredProjects[selectedCategory]?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects[selectedCategory].map(project => (
                  <ProjectCard
                    key={project.path}
                    project={project}
                    category={selectedCategory}
                    onSelect={handleProjectSelect}
                    onContextMenu={handleContextMenu}
                    onToggleStar={handleToggleStar}
                    isSelected={selectedProject?.path === project.path}
                    GitStatusIndicator={GitStatusIndicator}
                    ProjectTypeIcon={ProjectTypeIcon}
                    formatFileSize={formatFileSize}
                    formatDate={formatDate}
                  />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Package className="w-16 h-16" />}
                  title="No projects found"
                  description={
                    searchQuery || filters.types.length > 1 || filters.starredOnly
                      ? "No projects match your current filters."
                      : "Create your first project to get started."
                  }
                  actionLabel="Create New Project"
                  onAction={() => setShowCreateModal(true)}
                />
              )}
            </div>
          ) : (
            <EmptyState
              icon={<Folder className="w-16 h-16" />}
              title="Select a category"
              description="Choose a category from the sidebar to view your projects."
            />
          )}
        </div>

        {/* Project Details Sidebar */}
        {selectedProject && (
          <ProjectDetailsSidebar
            project={selectedProject}
            structure={projectStructure}
            onClose={() => setSelectedProject(null)}
            invoke={invoke}
            ProjectTypeIcon={ProjectTypeIcon}
            GitStatusIndicator={GitStatusIndicator}
            formatFileSize={formatFileSize}
            formatDate={formatDate}
            ProjectStructureView={ProjectStructureView}
          />
        )}
      </div>

      {/* Context Menu */}
      <ProjectContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        project={contextMenu.project}
        invoke={invoke}
      />

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateProject={handleCreateProject}
      />

      {/* Notification */}
      <NotificationAlert notification={notification} />
    </div>
  );
};

export default ProjectManager;