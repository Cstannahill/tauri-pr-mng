import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  FolderOpen,
  File,
  Plus,
  Terminal,
  Globe,
  Monitor,
  Package,
  RefreshCw,
  GitBranch,
  Zap,
  Database,
  Cpu
} from 'lucide-react';

import { NotificationAlert } from '@/components/notification-alert/notification-alert';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectContextMenu } from '@/components/projects/project-context-menu';
import { CategorySidebar } from '@/components/projects/category-sidebar';
import { SearchFilterBar } from '@/components/search-filter/search-filter-bar';
import { HeaderBar } from '@/components/header-bar/header-bar';
import { EmptyState } from '@/components/empty-state/empty-state';
import { invoke } from '@tauri-apps/api/core';

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
    'markdown': <File className="w-4 h-4 text-muted-foreground" />,
    'unknown': <Package className="w-4 h-4 text-muted-foreground" />
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

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Record<string, any[]>>({});
  const [selectedCategory, setSelectedCategory] = useState(null);
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
      const workspaceDir = await invoke('initialize_workspace') as string;
      setBaseDir(workspaceDir);
      await refreshProjects(workspaceDir);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      showNotification('Failed to initialize workspace', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProjects = async (dir: string = baseDir) => {
    try {
      const projectsData = await invoke('scan_projects', { baseDir: dir }) as Record<string, any[]>;
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to scan projects:', error);
      showNotification('Failed to scan projects', 'error');
    }
  };


  const handleProjectSelect = (project, category) => {
    // Navigate to project details page
    navigate(`/projects/${category}/${encodeURIComponent(project.name)}`);
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
      await invoke('create_project', {
        baseDir: baseDir, category, name,
        projectType: type
      });
      await refreshProjects();
      showNotification(`Project "${name}" created successfully`, 'success');
    } catch (error) {
      console.error('Failed to create project:', error);
      showNotification('Failed to create project', 'error');
    }
  };

  const handleToggleStar = async (project, category) => {
    try {
      await invoke('toggle_project_star', { project_path: project.path });
      await refreshProjects();
      showNotification(`Project ${project.starred ? 'unstarred' : 'starred'}`, 'success');
    } catch (error) {
      console.error('Failed to toggle star:', error);
      showNotification('Failed to update project', 'error');
    }
  };

  const filterProjects = (projectsData: Record<string, any[]>) => {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
          <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <CategorySidebar
          categories={categories}
          filteredProjects={filteredProjects}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
          onRefresh={refreshProjects}
        />

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {selectedCategory ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {categories.find(c => c.key === selectedCategory)?.label}
                </h2>
                <span className="text-sm text-muted-foreground">
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

export default ProjectsPage;
