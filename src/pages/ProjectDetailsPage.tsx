import React, { useState, useEffect } from 'react';
import TimelinePage from './TimelinePage';

// Helper component to fetch project UUID and render TimelinePage
function TimelineTabWithUuid({ projectPath }: { projectPath: string }) {
  const [projectId, setProjectId] = React.useState<string | null>(null);
  React.useEffect(() => {
    invoke<string>('get_or_create_project_uuid', { project_path: projectPath })
      .then(setProjectId)
      .catch(() => setProjectId(null));
  }, [projectPath]);
  if (!projectId) return <div>Loading timeline...</div>;
  return <TimelinePage projectId={projectId} />;
}
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Code, Terminal, GitBranch, Calendar, HardDrive, Files } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ProjectStructureView } from '@/components/projects/project-structure-view';
import { getProjectTypeLabel } from '@/lib/projectTypes';
import { badgeGradients } from '@/lib/badgeGradients';

const ProjectTypeIcon = ({ type }: { type: string }) => {
  const icons = {
    'tauri': <Code className="w-4 h-4 text-purple-500" />,
    'electron': <Code className="w-4 h-4 text-blue-500" />,
    'react': <Code className="w-4 h-4 text-blue-400" />,
    'next': <Code className="w-4 h-4 text-black dark:text-white" />,
    'rust': <Code className="w-4 h-4 text-orange-500" />,
    'node': <Code className="w-4 h-4 text-green-500" />,
    'python': <Code className="w-4 h-4 text-yellow-500" />,
    'go': <Code className="w-4 h-4 text-cyan-500" />,
    'markdown': <Files className="w-4 h-4 text-muted-foreground" />,
    'default': <Code className="w-4 h-4 text-muted-foreground" />,
  };
  return icons[type] || icons.default;
};

const GitStatusIndicator = ({ status }: { status: string }) => {
  const statusMap = {
    'clean': { text: 'Clean', color: 'text-green-500' },
    'modified': { text: 'Modified', color: 'text-yellow-500' },
    'ahead': { text: 'Ahead', color: 'text-blue-500' },
    'behind': { text: 'Behind', color: 'text-orange-500' },
    'diverged': { text: 'Diverged', color: 'text-red-500' },
  };
  
  const info = statusMap[status] || { text: status, color: 'text-muted-foreground' };
  
  return (
    <div className="flex items-center gap-1">
      <GitBranch className={`w-3 h-3 ${info.color}`} />
      <span className={`text-xs ${info.color}`}>{info.text}</span>
    </div>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const POLL_INTERVAL = 15000; // 15 seconds

const ProjectDetailsPage: React.FC = () => {
  const { category, projectName } = useParams<{ category: string; projectName: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [projectStructure, setProjectStructure] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCommitHash, setLastCommitHash] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (category && projectName) {
      loadProjectDetails();
    }
  }, [category, projectName]);

  // Fetch project UUID when project is loaded
  useEffect(() => {
    if (project && project.path) {
      invoke<string>('get_or_create_project_uuid', { project_path: project.path })
        .then(setProjectId)
        .catch(() => setProjectId(null));
    }
  }, [project]);

  // Poll for new commits and trigger timeline event
  useEffect(() => {
    if (!project || !project.path || !projectId) return;
    let stopped = false;
    let openaiKey = '';
    // Optionally, fetch OpenAI key from settings or env
    const poll = async () => {
      try {
        const hash = await invoke<string>('get_latest_commit_hash', { project_path: project.path });
        if (lastCommitHash && hash !== lastCommitHash) {
          // New commit detected, trigger timeline event
          await invoke('trigger_git_commit_timeline', {
            project_id: projectId,
            project_path: project.path,
            commit_hash: hash,
            openai_key: openaiKey,
          });
        }
        setLastCommitHash(hash);
      } catch (e) {
        // ignore errors
      }
      if (!stopped) setTimeout(poll, POLL_INTERVAL);
    };
    poll();
    return () => { stopped = true; };
    // eslint-disable-next-line
  }, [project, projectId]);

  const loadProjectDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get all projects and find the specific one
      const baseDir = await invoke<string>("initialize_workspace");
      const projectsMap = await invoke<Record<string, any[]>>("scan_projects", { baseDir });
      
      const projectsInCategory = projectsMap[category!];
      const foundProject = projectsInCategory?.find(p => p.name === projectName);
      
      if (!foundProject) {
        setError("Project not found");
        return;
      }
      
      setProject(foundProject);
      
      // Load project structure
      const structure = await invoke('get_project_structure', { 
        projectPath: foundProject.path 
      });
      setProjectStructure(structure);
      
    } catch (err) {
      console.error('Failed to load project details:', err);
      setError('Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">{error || "The requested project could not be found."}</p>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border p-6 flex-shrink-0">
          <Separator orientation="vertical" className="h-6" />
          <Link 
            to="/projects"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Projects
          </Link>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground capitalize">
            {category?.replace(/[-_]/g, ' ')}
          </span>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm font-medium">{project.name}</span>
        </div>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <ProjectTypeIcon type={project.project_type} />
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <p className="text-muted-foreground break-all">{project.path}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge
              className="capitalize"
              gradient={badgeGradients[project.project_type] || badgeGradients.unknown}
            >
              {getProjectTypeLabel(project.project_type)}
            </Badge>
            <GitStatusIndicator status={project.git_status} />
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => invoke('open_project_in_editor', { 
              projectPath: project.path, 
              editor: 'vscode' 
            })}
          >
            <Code className="w-4 h-4 mr-2" />
            Open in VS Code
          </Button>
          <Button
            variant="outline"
            onClick={() => invoke('open_project_in_terminal', { 
              projectPath: project.path 
            })}
          >
            <Terminal className="w-4 h-4 mr-2" />
            Open Terminal
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 bg-background">
        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6 h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project Info */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Type</p>
                      <div className="flex items-center gap-2">
                        <ProjectTypeIcon type={project.project_type} />
                        <Badge
                          className="capitalize"
                          gradient={badgeGradients[project.project_type] || badgeGradients.unknown}
                        >
                          {getProjectTypeLabel(project.project_type)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Git Status</p>
                      <GitStatusIndicator status={project.git_status} />
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Last Modified</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{formatDate(project.last_modified)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Size</p>
                      <div className="flex items-center gap-1">
                        <HardDrive className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{formatFileSize(project.size)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Files</p>
                      <div className="flex items-center gap-1">
                        <Files className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{project.files_count}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {project.files_count}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Files</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {formatFileSize(project.size)}
                    </div>
                    <div className="text-sm text-muted-foreground">Project Size</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {project.git_status === 'clean' ? '✓' : '!'}
                    </div>
                    <div className="text-sm text-muted-foreground">Git Status</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Structure */}
            <div>
              <ProjectStructureView 
                project={project} 
                structure={projectStructure} 
              />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 flex-1">
            <Card>
              <CardHeader>
                <CardTitle>Project Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    📊
                  </div>
                  <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                  <p className="text-muted-foreground mb-6">
                    Detailed analytics for {project.name} coming soon...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This will include code metrics, commit history, file changes, and more.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6 flex-1">
            {project && project.path && (
              <TimelineTabWithUuid projectPath={project.path} />
            )}
          </TabsContent>


          <TabsContent value="kanban" className="space-y-6 flex-1">
            <Card>
              <CardHeader>
                <CardTitle>Project Kanban Board</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    📋
                  </div>
                  <h3 className="text-lg font-medium mb-2">Kanban Board</h3>
                  <p className="text-muted-foreground mb-6">
                    Kanban board for {project.name} coming soon...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This will help you track tasks, issues, and progress for this specific project.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default ProjectDetailsPage;
