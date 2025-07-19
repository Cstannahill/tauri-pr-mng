import React, { useState, useEffect } from "react";
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
import { invoke } from "@tauri-apps/api/core";

export interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (category: string, name: string, type: string) => void;
}

export function CreateProjectDialog({ open, onOpenChange, onCreateProject }: CreateProjectDialogProps) {
  const [projectName, setProjectName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("desktop-apps");
  const [selectedType, setSelectedType] = useState("rust");
  const [step, setStep] = useState(0); // for multi-step


  // Suboptions for each project type
  const frontendLanguages = [
    { value: "rust", label: "Rust" },
    { value: "js-ts", label: "TypeScript / JavaScript" },
    { value: ".net", label: ".NET" },
  ];
  const tauriTemplates = {
    "rust": [
      { value: "vanilla", label: "Vanilla" },
      { value: "yew", label: "Yew" },
      { value: "leptos", label: "Leptos" },
      { value: "sycamore", label: "Sycamore" },
    ],
    "js-ts": [
      { value: "vanilla", label: "Vanilla" },
      { value: "vue", label: "Vue" },
      { value: "svelte", label: "Svelte" },
      { value: "react", label: "React" },
      { value: "solid", label: "Solid" },
      { value: "angular", label: "Angular" },
      { value: "preact", label: "Preact" },
    ],
    ".net": [
      { value: "blazor", label: "Blazor" },
    ],
  };
  const jsTsFlavors = [
    { value: "ts", label: "TypeScript" },
    { value: "js", label: "JavaScript" },
  ];
  const jsTsPackageManagers = [
    { value: "pnpm", label: "pnpm" },
    { value: "yarn", label: "yarn" },
    { value: "npm", label: "npm" },
    { value: "bun", label: "bun" },
  ];
  // React/Next/Vite suboptions
  const reactLikeTypes = ["react", "next"];
  // Node.js suboptions
  const nodeKinds = [
    { value: "api", label: "API" },
    { value: "cli", label: "CLI" },
    { value: "script", label: "Script" },
  ];
  // Python suboptions
  const pythonKinds = [
    { value: "script", label: "Script" },
    { value: "api", label: "API Backend" },
  ];
  // Rust suboptions
  const rustKinds = [
    { value: "cli", label: "CLI" },
    { value: "lib", label: "Library" },
    { value: "wasm", label: "WebAssembly" },
  ];

  // State for suboptions
  const [reactFlavor, setReactFlavor] = useState("ts");
  const [nodeKind, setNodeKind] = useState("api");
  const [pythonKind, setPythonKind] = useState("script");
  const [rustKind, setRustKind] = useState("cli");

  // For badge display
  const [tauriLang, setTauriLang] = useState("js-ts");
  const [tauriTemplate, setTauriTemplate] = useState("react");
  const [tauriFlavor, setTauriFlavor] = useState("ts");
  const [tauriPkg, setTauriPkg] = useState("pnpm");

  // Project types
  const projectTypes = [
    { value: "rust", label: "Rust", icon: <Zap className="w-4 h-4" /> },
    { value: "tauri", label: "Tauri App", icon: <Monitor className="w-4 h-4" /> },
    { value: "react", label: "React App", icon: <Globe className="w-4 h-4" /> },
    { value: "next", label: "Next.js App", icon: <Globe className="w-4 h-4" /> },
    { value: "node", label: "Node.js App", icon: <Terminal className="w-4 h-4" /> },
    { value: "python", label: "Python App", icon: <Database className="w-4 h-4" /> },
  ];

  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const baseDir = await invoke<string>("initialize_workspace");
        const projectsMap = await invoke<Record<string, any[]>>("scan_projects", { baseDir });
        const cats = Object.keys(projectsMap).map((key) => ({
          value: key,
          label: key.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        }));
        setCategories(cats);
        if (cats.length && !cats.find(c => c.value === selectedCategory)) {
          setSelectedCategory(cats[0].value);
        }
      } catch {}
    };
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Compose type string for Tauri
  const getTauriTypeString = () => {
    let badges = ["Tauri"];
    if (tauriLang === "rust") badges.push("Rust");
    if (tauriLang === "js-ts") badges.push(tauriTemplate.charAt(0).toUpperCase() + tauriTemplate.slice(1));
    if (tauriLang === "js-ts") badges.push(tauriFlavor === "ts" ? "TypeScript" : "JavaScript");
    if (tauriLang === "js-ts" || tauriLang === "rust") badges.push("Rust");
    if (tauriLang === ".net") badges.push("Blazor", ".NET");
    return badges;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      let typeString = selectedType;
      // Compose type string for each type with suboptions
      if (selectedType === "tauri") {
        typeString = `tauri:${tauriLang}:${tauriTemplate}:${tauriFlavor}:${tauriPkg}`;
      } else if (reactLikeTypes.includes(selectedType)) {
        typeString = `${selectedType}:${reactFlavor}`;
      } else if (selectedType === "node") {
        typeString = `node:${nodeKind}`;
      } else if (selectedType === "python") {
        typeString = `python:${pythonKind}`;
      } else if (selectedType === "rust") {
        typeString = `rust:${rustKind}`;
      }
      onCreateProject(selectedCategory, projectName.trim(), typeString);
      setProjectName("");
      setStep(0);
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
                  onClick={() => {
                    setSelectedType(type.value);
                    if (type.value === "tauri") setStep(1);
                    else setStep(0);
                  }}
                  className="justify-start"
                >
                  {type.icon}
                  <span className="text-sm font-medium">{type.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Multi-step suboptions for all project types */}
          {selectedType === "tauri" && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                {getTauriTypeString().map((badge) => (
                  <span key={badge} className="px-2 py-1 text-xs rounded bg-primary/10 text-primary font-semibold mr-1">
                    {badge}
                  </span>
                ))}
              </div>
              {/* ...existing Tauri stepper code... */}
              {step === 1 && (
                <div className="space-y-2">
                  <Label>Frontend Language</Label>
                  <div className="flex gap-2 flex-wrap">
                    {frontendLanguages.map((lang) => (
                      <Button
                        key={lang.value}
                        type="button"
                        variant={tauriLang === lang.value ? "default" : "outline"}
                        onClick={() => {
                          setTauriLang(lang.value);
                          setStep(2);
                        }}
                        className="text-xs"
                      >
                        {lang.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-2">
                  <Label>UI Template</Label>
                  <div className="flex gap-2 flex-wrap">
                    {tauriTemplates[tauriLang].map((tpl) => (
                      <Button
                        key={tpl.value}
                        type="button"
                        variant={tauriTemplate === tpl.value ? "default" : "outline"}
                        onClick={() => {
                          setTauriTemplate(tpl.value);
                          if (tauriLang === "js-ts") setStep(3);
                          else setStep(4);
                        }}
                        className="text-xs"
                      >
                        {tpl.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {step === 3 && tauriLang === "js-ts" && (
                <div className="space-y-2">
                  <Label>UI Flavor</Label>
                  <div className="flex gap-2 flex-wrap">
                    {jsTsFlavors.map((flavor) => (
                      <Button
                        key={flavor.value}
                        type="button"
                        variant={tauriFlavor === flavor.value ? "default" : "outline"}
                        onClick={() => {
                          setTauriFlavor(flavor.value);
                          setStep(4);
                        }}
                        className="text-xs"
                      >
                        {flavor.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {step === 4 && tauriLang === "js-ts" && (
                <div className="space-y-2">
                  <Label>Package Manager</Label>
                  <div className="flex gap-2 flex-wrap">
                    {jsTsPackageManagers.map((pm) => (
                      <Button
                        key={pm.value}
                        type="button"
                        variant={tauriPkg === pm.value ? "default" : "outline"}
                        onClick={() => setTauriPkg(pm.value)}
                        className="text-xs"
                      >
                        {pm.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                {step > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                )}
                {step < (tauriLang === "js-ts" ? 4 : 2) && (
                  <Button type="button" size="sm" onClick={() => setStep(step + 1)}>
                    Next
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* React/Next.js multi-step */}
          {reactLikeTypes.includes(selectedType) && (
            <div className="border rounded-lg p-4 bg-muted/50 flex items-center gap-2 mb-2">
              <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary font-semibold mr-1">
                {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
              </span>
              <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary font-semibold mr-1">
                {reactFlavor === "ts" ? "TypeScript" : "JavaScript"}
              </span>
              <div className="flex gap-2 ml-4">
                {jsTsFlavors.map((flavor) => (
                  <Button
                    key={flavor.value}
                    type="button"
                    variant={reactFlavor === flavor.value ? "default" : "outline"}
                    onClick={() => setReactFlavor(flavor.value)}
                    className="text-xs"
                  >
                    {flavor.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Node.js multi-step */}
          {selectedType === "node" && (
            <div className="border rounded-lg p-4 bg-muted/50 flex items-center gap-2 mb-2">
              <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary font-semibold mr-1">Node.js</span>
              <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary font-semibold mr-1">
                {nodeKinds.find(k => k.value === nodeKind)?.label}
              </span>
              <div className="flex gap-2 ml-4">
                {nodeKinds.map((kind) => (
                  <Button
                    key={kind.value}
                    type="button"
                    variant={nodeKind === kind.value ? "default" : "outline"}
                    onClick={() => setNodeKind(kind.value)}
                    className="text-xs"
                  >
                    {kind.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Python multi-step */}
          {selectedType === "python" && (
            <div className="border rounded-lg p-4 bg-muted/50 flex items-center gap-2 mb-2">
              <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary font-semibold mr-1">Python</span>
              <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary font-semibold mr-1">
                {pythonKinds.find(k => k.value === pythonKind)?.label}
              </span>
              <div className="flex gap-2 ml-4">
                {pythonKinds.map((kind) => (
                  <Button
                    key={kind.value}
                    type="button"
                    variant={pythonKind === kind.value ? "default" : "outline"}
                    onClick={() => setPythonKind(kind.value)}
                    className="text-xs"
                  >
                    {kind.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Rust multi-step */}
          {selectedType === "rust" && (
            <div className="border rounded-lg p-4 bg-muted/50 flex items-center gap-2 mb-2">
              <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary font-semibold mr-1">Rust</span>
              <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary font-semibold mr-1">
                {rustKinds.find(k => k.value === rustKind)?.label}
              </span>
              <div className="flex gap-2 ml-4">
                {rustKinds.map((kind) => (
                  <Button
                    key={kind.value}
                    type="button"
                    variant={rustKind === kind.value ? "default" : "outline"}
                    onClick={() => setRustKind(kind.value)}
                    className="text-xs"
                  >
                    {kind.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep(0);
                onOpenChange(false);
              }}
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
