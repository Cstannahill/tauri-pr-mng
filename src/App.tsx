import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  Plus, 
  Settings, 
  Terminal, 
  Code, 
  Globe, 
  Monitor,
  Package,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Trash2,
  Edit,
  Copy,
  GitBranch,
  Calendar,
  HardDrive,
  Files,
  Zap,
  Database,
  Cpu,
  Layers,
  X,
  Star,
  StarOff,
  Eye,
  EyeOff
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { SettingsDialog } from './components/blocks/settings-dialog/settings-dialog';

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

const TreeNode = ({ name, isFolder, isExpanded, onToggle, children, level = 0, icon }) => {
  return (
    <div>
      <div 
        className={`flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded-md transition-colors ${
          level > 0 ? 'ml-4' : ''
        }`}
        onClick={onToggle}
      >
        {isFolder && (
          <div className="w-4 h-4 flex items-center justify-center">
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </div>
        )}
        {icon || (isFolder ? (
          isExpanded ? <FolderOpen className="w-4 h-4 text-blue-500" /> : <Folder className="w-4 h-4 text-blue-500" />
        ) : (
          <File className="w-4 h-4 text-gray-500" />
        ))}
        <span className="text-sm font-medium">{name}</span>
      </div>
      {isExpanded && children && (
        <div className="ml-2">
          {children}
        </div>
      )}
    </div>
  );
};

const ProjectCard = ({ project, category, onSelect, onContextMenu, isSelected, onToggleStar }) => {
  return (
    <div 
      className={`group bg-white dark:bg-gray-800 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
        isSelected 
          ? 'border-blue-500 shadow-md' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={() => onSelect(project, category)}
      onContextMenu={(e) => onContextMenu(e, project, category)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ProjectTypeIcon type={project.project_type} />
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{project.name}</h3>
          </div>
          <div className="flex items-center gap-1">
            <button 
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(project, category);
              }}
            >
              {project.starred ? (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              ) : (
                <StarOff className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button 
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onContextMenu(e, project, category);
              }}
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs font-medium">
              {project.project_type}
            </span>
            <GitStatusIndicator status={project.git_status} />
          </div>
          
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3" />
            <span className="text-xs">{formatDate(project.last_modified)}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              <span>{formatFileSize(project.size)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Files className="w-3 h-3" />
              <span>{project.files_count} files</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectStructureView = ({ project, structure }) => {
  const [expandedPaths, setExpandedPaths] = useState({});
  const [showHidden, setShowHidden] = useState(false);

  const togglePath = (path) => {
    setExpandedPaths(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const isHidden = (name) => name.startsWith('.');

  const renderStructure = (obj, path = '', level = 0) => {
    if (!obj || typeof obj !== 'object') return null;

    return Object.entries(obj)
      .filter(([key]) => showHidden || !isHidden(key))
      .map(([key, value]) => {
        const currentPath = path ? `${path}/${key}` : key;
        const isFolder = value !== 'file' && typeof value === 'object';
        const isExpanded = expandedPaths[currentPath];

        return (
          <TreeNode
            key={currentPath}
            name={key}
            isFolder={isFolder}
            isExpanded={isExpanded}
            onToggle={() => isFolder && togglePath(currentPath)}
            level={level}
          >
            {isFolder && isExpanded && renderStructure(value, currentPath, level + 1)}
          </TreeNode>
        );
      });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Project Structure</h3>
        </div>
        <button
          onClick={() => setShowHidden(!showHidden)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {showHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showHidden ? 'Hide' : 'Show'} hidden
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {renderStructure(structure)}
      </div>
    </div>
  );
};

const ContextMenu = ({ isOpen, position, onClose, project, category }) => {
  if (!isOpen) return null;

  const menuItems = [
    { 
      label: 'Open in VS Code', 
      icon: <Code className="w-4 h-4" />, 
      action: () => invoke('open_project_in_editor', { projectPath: project.path, editor: 'vscode' })
    },
    { 
      label: 'Open in Terminal', 
      icon: <Terminal className="w-4 h-4" />, 
      action: () => invoke('open_project_in_terminal', { projectPath: project.path })
    },
    { 
      label: 'Open in File Manager', 
      icon: <Folder className="w-4 h-4" />, 
      action: () => invoke('open_project_in_file_manager', { projectPath: project.path })
    },
    { 
      label: 'Open in Browser', 
      icon: <ExternalLink className="w-4 h-4" />, 
      action: () => invoke('open_project_in_browser', { projectPath: project.path }),
      show: ['react', 'next', 'vue', 'svelte'].includes(project.project_type)
    },
    { label: 'separator' },
    { 
      label: 'Copy Path', 
      icon: <Copy className="w-4 h-4" />, 
      action: () => navigator.clipboard.writeText(project.path)
    },
    { 
      label: 'Rename Project', 
      icon: <Edit className="w-4 h-4" />, 
      action: () => console.log('Rename project', project.name)
    },
    { label: 'separator' },
    { 
      label: 'Delete Project', 
      icon: <Trash2 className="w-4 h-4" />, 
      action: () => console.log('Delete project', project.name),
      danger: true
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div 
        className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-48 py-1"
        style={{ left: position.x, top: position.y }}
      >
        {menuItems.map((item, index) => {
          if (item.label === 'separator') {
            return <div key={index} className="h-px bg-gray-200 dark:bg-gray-700 my-1" />;
          }
          
          if (item.show === false) return null;
          
          return (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                item.danger 
                  ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => {
                item.action();
                onClose();
              }}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
};

const CreateProjectModal = ({ isOpen, onClose, onCreateProject }) => {
  const [projectName, setProjectName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('desktop-apps');
  const [selectedType, setSelectedType] = useState('rust');

  const projectTypes = [
    { value: 'rust', label: 'Rust', icon: <Zap className="w-4 h-4" /> },
    { value: 'tauri', label: 'Tauri App', icon: <Monitor className="w-4 h-4" /> },
    { value: 'react', label: 'React App', icon: <Globe className="w-4 h-4" /> },
    { value: 'next', label: 'Next.js App', icon: <Globe className="w-4 h-4" /> },
    { value: 'node', label: 'Node.js App', icon: <Terminal className="w-4 h-4" /> },
    { value: 'python', label: 'Python App', icon: <Database className="w-4 h-4" /> },
  ];

  const categories = [
    { value: 'desktop-apps', label: 'Desktop Apps' },
    { value: 'web-apps', label: 'Web Apps' },
    { value: 'cli-apps', label: 'CLI Apps' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (projectName.trim()) {
      onCreateProject(selectedCategory, projectName.trim(), selectedType);
      setProjectName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="my-awesome-project"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {projectTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={`flex items-center gap-2 p-3 rounded-md border-2 transition-colors ${
                    selectedType === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  {type.icon}
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FilterDropdown = ({ isOpen, onClose, filters, onFiltersChange }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
      <div className="p-4 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Project Type
          </label>
          <div className="space-y-2">
            {['all', 'rust', 'tauri', 'react', 'next', 'node', 'python'].map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.types.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onFiltersChange({
                        ...filters,
                        types: [...filters.types, type]
                      });
                    } else {
                      onFiltersChange({
                        ...filters,
                        types: filters.types.filter(t => t !== type)
                      });
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.starredOnly}
              onChange={(e) => onFiltersChange({ ...filters, starredOnly: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm">Starred only</span>
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onFiltersChange({ types: ['all'], starredOnly: false })}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
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
  const [showFilters, setShowFilters] = useState(false);
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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Manager</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {baseDir} • {getTotalProjectCount()} projects • {getStarredProjectCount()} starred
              </p>
            </div>
          </div>
          {/* <SettingsDialog /> */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
            
            <button
              onClick={refreshProjects}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <SettingsDialog />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              {(filters.types.length > 1 || filters.starredOnly) && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                  {filters.types.length > 1 ? filters.types.length - 1 : 0}
                  {filters.starredOnly ? '+' : ''}
                </span>
              )}
            </button>
            
            <FilterDropdown
              isOpen={showFilters}
              onClose={() => setShowFilters(false)}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Categories
            </h2>
            <div className="space-y-1">
              {categories.map(category => {
                const projectCount = filteredProjects[category.key]?.length || 0;
                const isSelected = selectedCategory === category.key;
                
                return (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {category.icon}
                      <span className="font-medium">{category.label}</span>
                    </div>
                    <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                      {projectCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

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
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No projects found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {searchQuery || filters.types.length > 1 || filters.starredOnly
                      ? "No projects match your current filters."
                      : "Create your first project to get started."}
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create New Project
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a category
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a category from the sidebar to view your projects.
              </p>
            </div>
          )}
        </div>

        {/* Project Details Sidebar */}
        {selectedProject && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Project Details
                </h3>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {selectedProject.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedProject.path}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                    <div className="flex items-center gap-2">
                      <ProjectTypeIcon type={selectedProject.project_type} />
                      <span className="text-sm font-medium">{selectedProject.project_type}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Git Status</p>
                    <GitStatusIndicator status={selectedProject.git_status} />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Last Modified</p>
                  <p className="text-sm font-medium">{formatDate(selectedProject.last_modified)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Size</p>
                    <p className="text-sm font-medium">{formatFileSize(selectedProject.size)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Files</p>
                    <p className="text-sm font-medium">{selectedProject.files_count}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => invoke('open_project_in_editor', { projectPath: selectedProject.path, editor: 'vscode' })}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Code className="w-4 h-4" />
                    Open
                  </button>
                  <button
                    onClick={() => invoke('open_project_in_terminal', { projectPath: selectedProject.path })}
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Terminal className="w-4 h-4" />
                    Terminal
                  </button>
                </div>
              </div>

              <ProjectStructureView 
                project={selectedProject} 
                structure={projectStructure} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        project={contextMenu.project}
        category={contextMenu.category}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert className={`${
            notification.type === 'error' ? 'border-red-200 bg-red-50 dark:bg-red-900/20' :
            notification.type === 'success' ? 'border-green-200 bg-green-50 dark:bg-green-900/20' :
            'border-blue-200 bg-blue-50 dark:bg-blue-900/20'
          }`}>
            <AlertDescription className={`${
              notification.type === 'error' ? 'text-red-800 dark:text-red-200' :
              notification.type === 'success' ? 'text-green-800 dark:text-green-200' :
              'text-blue-800 dark:text-blue-200'
            }`}>
              {notification.message}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;