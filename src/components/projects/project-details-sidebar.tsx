import React from "react";
import { Code, Terminal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getProjectTypeLabel } from "@/lib/projectTypes";
import { Badge } from "@/components/ui/badge";
import { badgeGradients } from "@/lib/badgeGradients";

export interface ProjectDetailsSidebarProps {
  project: {
    name: string;
    project_type: string;
    last_modified: string;
    size: number;
    files_count: number;
    path: string;
    git_status: string;
  };
  structure: any;
  onClose: () => void;
  invoke: (cmd: string, args?: any) => Promise<any>;
  ProjectTypeIcon: React.ComponentType<{ type: string }>;
  GitStatusIndicator: React.ComponentType<{ status: string }>;
  formatFileSize: (bytes: number) => string;
  formatDate: (str: string) => string;
  ProjectStructureView: React.ComponentType<{ project: any; structure: any }>;
}

export function ProjectDetailsSidebar({
  project,
  structure,
  onClose,
  invoke,
  ProjectTypeIcon,
  GitStatusIndicator,
  formatFileSize,
  formatDate,
  ProjectStructureView,
}: ProjectDetailsSidebarProps) {
  return (
    <aside className="w-full md:w-80 min-h-screen h-full flex flex-col md:fixed md:inset-y-0 md:right-0 z-40">
      <div className="bg-sidebar text-sidebar-foreground border-l border-border flex flex-col flex-1 h-full">
        <ScrollArea className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Project Details</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">{project.name}</h4>
              <p className="text-sm text-muted-foreground break-all">{project.path}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
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
                <p className="text-xs text-muted-foreground">Git Status</p>
                <GitStatusIndicator status={project.git_status} />
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Last Modified</p>
              <p className="text-sm font-medium">{formatDate(project.last_modified)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Size</p>
                <p className="text-sm font-medium">{formatFileSize(project.size)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Files</p>
                <p className="text-sm font-medium">{project.files_count}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => invoke('open_project_in_editor', { projectPath: project.path, editor: 'vscode' })}
              >
                <Code className="w-4 h-4" />
                Open
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => invoke('open_project_in_terminal', { projectPath: project.path })}
              >
                <Terminal className="w-4 h-4" />
                Terminal
              </Button>
            </div>
          </div>

            <ProjectStructureView project={project} structure={structure} />
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
