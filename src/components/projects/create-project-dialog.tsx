import React, { useState, useEffect } from "react";
import { Zap, Monitor, Globe, Terminal, Database, Code } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { badgeGradients } from "@/lib/badgeGradients";
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
  const [step, setStep] = useState(0); // 0: basic form, 1: tauri advanced, 2: other sub-options


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
  // .NET suboptions
  const dotnetKinds = [
    { value: "webapi", label: "Web API" },
    { value: "console", label: "Console App" },
    { value: "blazor", label: "Blazor" },
    { value: "mvc", label: "MVC" },
    { value: "classlib", label: "Class Library" },
  ];

  // Types that have sub-options (excluding Tauri which has its own advanced flow)
  const hasSubOptions = (type: string) => 
    reactLikeTypes.includes(type) || ["node", "python", "rust", "dotnet"].includes(type);

  // State for suboptions
  const [reactFlavor, setReactFlavor] = useState("ts");
  const [nodeKind, setNodeKind] = useState("api");
  const [pythonKind, setPythonKind] = useState("script");
  const [rustKind, setRustKind] = useState("cli");
  const [dotnetKind, setDotnetKind] = useState("webapi");

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
    { value: "dotnet", label: ".NET App", icon: <Code className="w-4 h-4" /> },
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


  // Compose type string for Tauri and return badge info
  const getTauriTypeString = () => {
    let badges: { label: string; key: string }[] = [
      { label: "Tauri", key: "tauri" },
    ];
    if (tauriLang === "rust") badges.push({ label: "Rust", key: "rust" });
    if (tauriLang === "js-ts") badges.push({ label: tauriTemplate.charAt(0).toUpperCase() + tauriTemplate.slice(1), key: tauriTemplate });
    if (tauriLang === "js-ts") badges.push({ label: tauriFlavor === "ts" ? "TypeScript" : "JavaScript", key: tauriFlavor === "ts" ? "typescript" : "javascript" });
    if (tauriLang === "js-ts" || tauriLang === "rust") badges.push({ label: "Rust", key: "rust" });
    if (tauriLang === ".net") { badges.push({ label: "Blazor", key: "blazor" }); badges.push({ label: ".NET", key: "dotnet" }); }
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
      } else if (selectedType === "dotnet") {
        typeString = `dotnet:${dotnetKind}`;
      }
      onCreateProject(selectedCategory, projectName.trim(), typeString);
      setProjectName("");
      setStep(0);
      // Reset sub-option states
      setReactFlavor("ts");
      setNodeKind("api");
      setPythonKind("script");
      setRustKind("cli");
      setDotnetKind("webapi");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 bg-background/95 shadow-xl rounded-2xl">
        <Card className="bg-transparent shadow-none border-none">
          <CardContent className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {step === 0 ? "Create New Project" : step === 1 ? "Configure Tauri App" : "Configure Project Options"}
              </DialogTitle>
            </DialogHeader>
            {step === 0 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="my-awesome-project"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger id="category" className="w-full" size="default">
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
                  <div className="flex flex-col gap-2">
                    <Label>Project Type</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {projectTypes.map((type) => (
                        <Button
                          key={type.value}
                          type="button"
                          variant={selectedType === type.value ? "default" : "outline"}
                          onClick={() => setSelectedType(type.value)}
                          className="justify-start h-12 text-base font-medium rounded-xl border border-border/60 shadow-sm bg-background/80 hover:bg-accent/60"
                        >
                          {type.icon}
                          <span>{type.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <Separator className="my-6" />
                <DialogFooter className="flex flex-row gap-2 justify-between">
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
                  {selectedType === "tauri" ? (
                    <Button type="button" onClick={() => setStep(1)}>
                      Configure Tauri
                    </Button>
                  ) : hasSubOptions(selectedType) ? (
                    <Button type="button" onClick={() => setStep(2)}>
                      Configure Options
                    </Button>
                  ) : (
                    <Button type="submit">Create Project</Button>
                  )}
                </DialogFooter>
              </form>
            )}

             {step === 1 && selectedType === "tauri" && (
               <div className="space-y-6">
                 <div className="flex flex-wrap gap-2 mb-4">
                   {getTauriTypeString().map((badge) => (
                     <Badge key={badge.key} gradient={badgeGradients[badge.key] || undefined} className="font-semibold px-3 py-1 rounded-lg">
                       {badge.label}
                     </Badge>
                   ))}
                 </div>
            <Card className="bg-muted/60 border-none shadow-none">
              <CardContent className="p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <Label>Frontend Language</Label>
                  <div className="flex gap-2 flex-wrap">
                    {frontendLanguages.map((lang) => (
                      <Badge
                        key={lang.value}
                        onClick={() => setTauriLang(lang.value)}
                        gradient={tauriLang === lang.value ? (badgeGradients[lang.value.replace('.', '')] || badgeGradients.unknown) : undefined}
                        className={`cursor-pointer px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                          tauriLang === lang.value ? 'ring-2 ring-primary/20' : 'bg-muted hover:bg-muted/80 text-foreground'
                        }`}
                      >
                        {lang.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>UI Template</Label>
                  <div className="flex gap-2 flex-wrap">
                    {tauriTemplates[tauriLang].map((tpl) => (
                      <Badge
                        key={tpl.value}
                        onClick={() => setTauriTemplate(tpl.value)}
                        gradient={tauriTemplate === tpl.value ? (badgeGradients[tpl.value] || badgeGradients.unknown) : undefined}
                        className={`cursor-pointer px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                          tauriTemplate === tpl.value ? 'ring-2 ring-primary/20' : 'bg-muted hover:bg-muted/80 text-foreground'
                        }`}
                      >
                        {tpl.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                {tauriLang === "js-ts" && (
                  <div className="flex flex-col gap-2">
                    <Label>UI Flavor</Label>
                    <div className="flex gap-2 flex-wrap">
                      {jsTsFlavors.map((flavor) => (
                        <Badge
                          key={flavor.value}
                          onClick={() => setTauriFlavor(flavor.value)}
                          gradient={tauriFlavor === flavor.value ? (badgeGradients[flavor.value] || badgeGradients.unknown) : undefined}
                          className={`cursor-pointer px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                            tauriFlavor === flavor.value ? 'ring-2 ring-primary/20' : 'bg-muted hover:bg-muted/80 text-foreground'
                          }`}
                        >
                          {flavor.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {tauriLang === "js-ts" && (
                  <div className="flex flex-col gap-2">
                    <Label>Package Manager</Label>
                    <div className="flex gap-2 flex-wrap">
                      {jsTsPackageManagers.map((pm) => (
                        <Button
                          key={pm.value}
                          type="button"
                          variant={tauriPkg === pm.value ? "default" : "outline"}
                          onClick={() => setTauriPkg(pm.value)}
                          className="text-base rounded-lg"
                        >
                          {pm.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <DialogFooter className="flex flex-row gap-2 justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button type="button" onClick={handleSubmit}>
                Create Project
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && hasSubOptions(selectedType) && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge gradient={badgeGradients[selectedType] || badgeGradients.unknown} className="font-semibold px-3 py-1 rounded-lg">
                {projectTypes.find(t => t.value === selectedType)?.label}
              </Badge>
              {reactLikeTypes.includes(selectedType) && (
                <Badge gradient={badgeGradients[reactFlavor === "ts" ? "typescript" : "javascript"] || badgeGradients.unknown} className="font-semibold px-3 py-1 rounded-lg">
                  {reactFlavor === "ts" ? "TypeScript" : "JavaScript"}
                </Badge>
              )}
              {selectedType === "node" && (
                <Badge gradient={badgeGradients[nodeKind] || badgeGradients.unknown} className="font-semibold px-3 py-1 rounded-lg">
                  {nodeKinds.find(k => k.value === nodeKind)?.label}
                </Badge>
              )}
              {selectedType === "python" && (
                <Badge gradient={badgeGradients[pythonKind] || badgeGradients.unknown} className="font-semibold px-3 py-1 rounded-lg">
                  {pythonKinds.find(k => k.value === pythonKind)?.label}
                </Badge>
              )}
              {selectedType === "rust" && (
                <Badge gradient={badgeGradients[rustKind] || badgeGradients.unknown} className="font-semibold px-3 py-1 rounded-lg">
                  {rustKinds.find(k => k.value === rustKind)?.label}
                </Badge>
              )}
              {selectedType === "dotnet" && (
                <Badge gradient={badgeGradients[dotnetKind] || badgeGradients.unknown} className="font-semibold px-3 py-1 rounded-lg">
                  {dotnetKinds.find(k => k.value === dotnetKind)?.label}
                </Badge>
              )}
            </div>
            <Card className="bg-muted/60 border-none shadow-none">
              <CardContent className="p-6 flex flex-col gap-6">
                {reactLikeTypes.includes(selectedType) && (
                  <div className="flex flex-col gap-2">
                    <Label>Language</Label>
                    <div className="flex gap-2 flex-wrap">
                      {jsTsFlavors.map((flavor) => (
                        <Badge
                          key={flavor.value}
                          onClick={() => setReactFlavor(flavor.value)}
                          gradient={reactFlavor === flavor.value ? (badgeGradients[flavor.value] || badgeGradients.unknown) : undefined}
                          className={`cursor-pointer px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                            reactFlavor === flavor.value ? 'ring-2 ring-primary/20' : 'bg-muted hover:bg-muted/80 text-foreground'
                          }`}
                        >
                          {flavor.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedType === "node" && (
                  <div className="flex flex-col gap-2">
                    <Label>Project Type</Label>
                    <div className="flex gap-2 flex-wrap">
                      {nodeKinds.map((kind) => (
                        <Badge
                          key={kind.value}
                          onClick={() => setNodeKind(kind.value)}
                          gradient={nodeKind === kind.value ? (badgeGradients[kind.value] || badgeGradients.unknown) : undefined}
                          className={`cursor-pointer px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                            nodeKind === kind.value ? 'ring-2 ring-primary/20' : 'bg-muted hover:bg-muted/80 text-foreground'
                          }`}
                        >
                          {kind.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedType === "python" && (
                  <div className="flex flex-col gap-2">
                    <Label>Project Type</Label>
                    <div className="flex gap-2 flex-wrap">
                      {pythonKinds.map((kind) => (
                        <Badge
                          key={kind.value}
                          onClick={() => setPythonKind(kind.value)}
                          gradient={pythonKind === kind.value ? (badgeGradients[kind.value] || badgeGradients.unknown) : undefined}
                          className={`cursor-pointer px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                            pythonKind === kind.value ? 'ring-2 ring-primary/20' : 'bg-muted hover:bg-muted/80 text-foreground'
                          }`}
                        >
                          {kind.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedType === "rust" && (
                  <div className="flex flex-col gap-2">
                    <Label>Project Type</Label>
                    <div className="flex gap-2 flex-wrap">
                      {rustKinds.map((kind) => (
                        <Badge
                          key={kind.value}
                          onClick={() => setRustKind(kind.value)}
                          gradient={rustKind === kind.value ? (badgeGradients[kind.value] || badgeGradients.unknown) : undefined}
                          className={`cursor-pointer px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                            rustKind === kind.value ? 'ring-2 ring-primary/20' : 'bg-muted hover:bg-muted/80 text-foreground'
                          }`}
                        >
                          {kind.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedType === "dotnet" && (
                  <div className="flex flex-col gap-2">
                    <Label>Project Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {dotnetKinds.map((kind) => (
                        <Badge
                          key={kind.value}
                          onClick={() => setDotnetKind(kind.value)}
                          gradient={dotnetKind === kind.value ? (badgeGradients[kind.value] || badgeGradients.unknown) : undefined}
                          className={`cursor-pointer px-3 py-2 text-sm font-medium rounded-lg transition-all justify-start ${
                            dotnetKind === kind.value ? 'ring-2 ring-primary/20' : 'bg-muted hover:bg-muted/80 text-foreground'
                          }`}
                        >
                          {kind.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <DialogFooter className="flex flex-row gap-2 justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button type="button" onClick={handleSubmit}>
                Create Project
              </Button>
            </DialogFooter>
          </div>
        )}
        </CardContent>
      </Card>
    </DialogContent>
  </Dialog>
  );
}
