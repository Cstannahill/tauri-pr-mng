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
        className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-48 py-1"
        style={{ left: position.x, top: position.y }}
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
              className={`w-full justify-start gap-3 px-4 py-2 text-sm font-normal ${
                item.danger
                  ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                item.action();
                onClose();
              }}
            >
              {item.icon}
              {item.label}
            </Button>
          );
        })}
      </div>
    </>
  );
}
