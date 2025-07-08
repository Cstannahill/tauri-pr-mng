import React, { useState } from "react";
import { Zap, Monitor, Globe, Terminal, Database } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (category: string, name: string, type: string) => void;
}

export function CreateProjectDialog({ open, onOpenChange, onCreateProject }: CreateProjectDialogProps) {
  const [projectName, setProjectName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("desktop-apps");
  const [selectedType, setSelectedType] = useState("rust");

  const projectTypes = [
    { value: "rust", label: "Rust", icon: <Zap className="w-4 h-4" /> },
    { value: "tauri", label: "Tauri App", icon: <Monitor className="w-4 h-4" /> },
    { value: "react", label: "React App", icon: <Globe className="w-4 h-4" /> },
    { value: "next", label: "Next.js App", icon: <Globe className="w-4 h-4" /> },
    { value: "node", label: "Node.js App", icon: <Terminal className="w-4 h-4" /> },
    { value: "python", label: "Python App", icon: <Database className="w-4 h-4" /> },
  ];

  const categories = [
    { value: "desktop-apps", label: "Desktop Apps" },
    { value: "web-apps", label: "Web Apps" },
    { value: "cli-apps", label: "CLI Apps" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      onCreateProject(selectedCategory, projectName.trim(), selectedType);
      setProjectName("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-awesome-project"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Project Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {projectTypes.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={selectedType === type.value ? "default" : "outline"}
                  onClick={() => setSelectedType(type.value)}
                  className="justify-start"
                >
                  {type.icon}
                  <span className="text-sm font-medium">{type.label}</span>
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
