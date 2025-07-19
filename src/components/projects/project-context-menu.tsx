import React from "react";
import { Code, Terminal, Folder, ExternalLink, Trash2, Edit, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface ProjectContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  project: {
    name: string;
    project_type: string;
    path: string;
    starred?: boolean;
  } | null;
  invoke: (cmd: string, args?: any) => Promise<any>;
}

export function ProjectContextMenu({
  isOpen,
  position,
  onClose,
  project,
  invoke,
}: ProjectContextMenuProps) {
  if (!isOpen || !project) return null;

  const menuItems = [
    {
      label: "Open in VS Code",
      icon: <Code className="w-4 h-4" />,
      action: () => invoke("open_project_in_editor", { projectPath: project.path, editor: "vscode" }),
    },
    {
      label: "Open in Terminal",
      icon: <Terminal className="w-4 h-4" />,
      action: () => invoke("open_project_in_terminal", { projectPath: project.path }),
    },
    {
      label: "Open in File Manager",
      icon: <Folder className="w-4 h-4" />,
      action: () => invoke("open_project_in_file_manager", { projectPath: project.path }),
    },
    {
      label: "Open in Browser",
      icon: <ExternalLink className="w-4 h-4" />,
      action: () => invoke("open_project_in_browser", { projectPath: project.path }),
      show: ["react", "next", "vue", "svelte"].includes(project.project_type),
    },
    { label: "separator" },
    {
      label: "Copy Path",
      icon: <Copy className="w-4 h-4" />,
      action: () => navigator.clipboard.writeText(project.path),
    },
    {
      label: "Rename Project",
      icon: <Edit className="w-4 h-4" />,
      action: () => console.log("Rename project", project.name),
    },
    { label: "separator" },
    {
      label: "Delete Project",
      icon: <Trash2 className="w-4 h-4" />,
      action: () => console.log("Delete project", project.name),
      danger: true,
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 min-w-52 py-2 px-1 border border-border/60 rounded-xl shadow-2xl backdrop-blur-md bg-background/80 dark:bg-card/90"
        style={{ left: position.x, top: position.y, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }}
      >
        {menuItems.map((item, index) => {
          if (item.label === "separator") {
            return <Separator key={index} className="my-1" />;
          }
          if (item.show === false) return null;
          return (
              <Button
                key={index}
                variant="ghost"
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                  ${item.danger
                    ? "text-destructive hover:bg-destructive/15 dark:hover:bg-destructive/30 focus-visible:ring-destructive/40"
                    : "hover:bg-primary/5 dark:hover:bg-muted/20 focus:bg-primary/10 dark:focus:bg-muted/30"}
                `}
                style={{
                  justifyContent: 'flex-start',
                  fontWeight: item.danger ? 600 : 500,
                  letterSpacing: 0.01,
                }}
                onClick={() => {
                  item.action();
                  onClose();
                }}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </Button>
          );
        })}
      </div>
    </>
  );
}
