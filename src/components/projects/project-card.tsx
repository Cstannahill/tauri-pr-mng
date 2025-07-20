import { Calendar, Files, HardDrive, MoreHorizontal, Star, StarOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import React from "react";
import { getProjectTypeLabel } from "@/lib/projectTypes";
import { badgeGradients } from "@/lib/badgeGradients";

export interface ProjectCardProps {
  project: {
    name: string;
    project_type: string;
    last_modified: string;
    size: number;
    files_count: number;
    path: string;
    git_status: string;
    starred?: boolean;
  };
  category: string;
  onSelect: (project: ProjectCardProps["project"], category: string) => void;
  onContextMenu: (
    e: React.MouseEvent,
    project: ProjectCardProps["project"],
    category: string
  ) => void;
  onToggleStar: (project: ProjectCardProps["project"], category: string) => void;
  GitStatusIndicator: React.ComponentType<{ status: string }>;
  ProjectTypeIcon: React.ComponentType<{ type: string }>;
  formatFileSize: (bytes: number) => string;
  formatDate: (str: string) => string;
}

export function ProjectCard({
  project,
  category,
  onSelect,
  onContextMenu,
  onToggleStar,
  GitStatusIndicator,
  ProjectTypeIcon,
  formatFileSize,
  formatDate,
}: ProjectCardProps) {
  return (
    <Card
      className="group cursor-pointer border-2 transition-all duration-200 hover:shadow-lg border-border hover:border-muted hover:shadow-lg"
      onClick={() => onSelect(project, category)}
      onContextMenu={(e) => onContextMenu(e, project, category)}
    >
      <CardContent className="p-4 space-y-2">
        <div className="relative mb-3">
          {/* Action buttons absolutely positioned at the card's top-right, outside content padding */}
          <div
            className="absolute -top-3 -right-3 flex items-center gap-1 bg-background/80 rounded-lg shadow-sm px-0.5 py-0.5 z-20 border border-border/40 backdrop-blur-sm"
            style={{ minWidth: 'fit-content', pointerEvents: 'auto' }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="!w-7 !h-7 p-0 opacity-60 hover:opacity-100 focus:opacity-100 transition-opacity rounded-md"
              style={{ background: 'transparent' }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(project, category);
              }}
              tabIndex={0}
              aria-label={project.starred ? 'Unstar project' : 'Star project'}
            >
              {project.starred ? (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              ) : (
                <StarOff className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="!w-7 !h-7 p-0 opacity-60 hover:opacity-100 focus:opacity-100 transition-opacity rounded-md"
              style={{ background: 'transparent' }}
              onClick={(e) => {
                e.stopPropagation();
                onContextMenu(e, project, category);
              }}
              tabIndex={0}
              aria-label="Project options"
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <ProjectTypeIcon type={project.project_type} />
            <h3 className="font-semibold truncate">{project.name}</h3>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <Badge
            className="capitalize"
            gradient={badgeGradients[project.project_type] || badgeGradients.unknown}
          >
            {getProjectTypeLabel(project.project_type)}
          </Badge>
          <GitStatusIndicator status={project.git_status} />
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span className="text-xs">{formatDate(project.last_modified)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            <span>{formatFileSize(project.size)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Files className="w-3 h-3" />
            <span>{project.files_count} files</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
