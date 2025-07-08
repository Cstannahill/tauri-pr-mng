import React from "react";
import { Code, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "../settings-dialog/settings-dialog";

export interface HeaderBarProps {
  baseDir: string;
  totalProjects: number;
  starredProjects: number;
  onNewProject: () => void;
  onRefresh: () => void;
}

export function HeaderBar({
  baseDir,
  totalProjects,
  starredProjects,
  onNewProject,
  onRefresh,
}: HeaderBarProps) {
  return (
    <div className="bg-card border-b border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Code className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Project Manager</h1>
            <p className="text-sm text-muted-foreground">
              {baseDir} • {totalProjects} projects • {starredProjects} starred
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onNewProject}>
            <Plus className="w-4 h-4" />
            New Project
          </Button>
          <Button variant="ghost" size="icon" onClick={onRefresh}>
            <RefreshCw className="w-5 h-5" />
          </Button>
          <SettingsDialog />
        </div>
      </div>
    </div>
  );
}

export default HeaderBar;
