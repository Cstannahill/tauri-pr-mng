import React from "react";
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
}

export function CategorySidebar({
  categories,
  filteredProjects,
  selectedCategory,
  onSelect,
}: CategorySidebarProps) {
  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground border-r border-border min-h-screen">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Categories
        </h2>
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
                  <span className="text-sm bg-muted px-2 py-1 rounded-full">
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
