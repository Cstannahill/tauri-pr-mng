import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Category {
  key: string;
  label: string;
  icon: React.ReactNode;
}

export interface CategorySidebarProps {
  categories: Category[];
  filteredProjects: Record<string, any[]>;
  selectedCategory: string | null;
  onSelect: (key: string) => void;
  onRefresh?: () => void;
}

export function CategorySidebar({
  filteredProjects,
  selectedCategory,
  onSelect,
  onRefresh,
}: CategorySidebarProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories dynamically from backend
  const fetchCategories = async () => {
    try {
      const baseDir = await invoke<string>("initialize_workspace");
      const projectsMap = await invoke<Record<string, any[]>>("scan_projects", { baseDir });
      // Build categories from keys
      const cats: Category[] = Object.keys(projectsMap).map((key) => ({
        key,
        label: key.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        icon: getCategoryIcon(key),
      }));
      setCategories(cats);
    } catch (e) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Optionally re-fetch when onRefresh is called
  // Only fetch categories on mount and after add, not on every render or onRefresh change

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      setError("Category name cannot be empty");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await invoke("create_category", { name: categoryName });
      setCategoryName("");
      setAddDialogOpen(false);
      await fetchCategories();
    } catch (e) {
      setError("Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get icon for category
  function getCategoryIcon(key: string) {
    if (/desktop/i.test(key)) return <span>🖥️</span>;
    if (/web/i.test(key)) return <span>🌐</span>;
    if (/cli/i.test(key)) return <span>⌨️</span>;
    if (/other/i.test(key)) return <span>🗂️</span>;
    if (/ai/i.test(key)) return <span>🤖</span>;
    return <span>📁</span>;
  }

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground border-r border-border min-h-screen">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Categories
          </h2>
          <Button size="icon" variant="ghost" onClick={() => setAddDialogOpen(true)} title="Add Category">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
            </DialogHeader>
            <Input
              autoFocus
              placeholder="Category name"
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
              disabled={loading}
              onKeyDown={e => {
                if (e.key === "Enter") handleAddCategory();
              }}
            />
            {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setAddDialogOpen(false)} disabled={loading}>Cancel</Button>
              <Button onClick={handleAddCategory} disabled={loading || !categoryName.trim()}>
                {loading ? "Adding..." : "Add"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <ScrollArea className="h-[calc(100vh-6rem)] pr-2">
          <div className="space-y-1">
            {categories.map((category) => {
              const projectCount = filteredProjects[category.key]?.length || 0;
              const isSelected = selectedCategory === category.key;
              return (
                <Button
                  key={category.key}
                  variant="ghost"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-muted text-foreground dark:hover:bg-muted/50"
                  }`}
                  onClick={() => onSelect(category.key)}
                >
                  <span className="flex items-center gap-3">
                    {category.icon}
                    <span className="font-medium">{category.label}</span>
                  </span>
                  <span
                    className="ml-2 inline-flex items-center justify-center min-w-[1.8em] px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-tr from-primary/80 to-muted/60 text-primary-foreground border border-border shadow-sm transition-colors duration-200"
                    style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }}
                  >
                    {projectCount}
                  </span>
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default CategorySidebar;
