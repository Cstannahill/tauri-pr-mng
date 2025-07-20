import React, { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterDropdown } from "./filter-dropdown";

export interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: { types: string[]; starredOnly: boolean };
  onFiltersChange: (filters: { types: string[]; starredOnly: boolean }) => void;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
}: SearchFilterBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 h-10 rounded-full bg-[#181A20]/90 border border-zinc-700 text-zinc-100 placeholder:text-zinc-400 shadow-[0_1.5px_6px_0_rgba(0,0,0,0.12),inset_0_1.5px_4px_0_rgba(0,0,0,0.18)] focus:bg-[#23242b]/95 focus:border-zinc-500 focus:shadow-lg focus:shadow-zinc-900/30 transition-all text-base"
            autoComplete="off"
          />
        </div>
        <div className="relative">
          <Button variant="outline" className="gap-2" onClick={() => setOpen(!open)}>
            <Filter className="w-4 h-4" />
            Filters
            {(filters.types.length > 1 || filters.starredOnly) && (
              <Badge variant="secondary">
                {filters.types.length > 1 ? filters.types.length - 1 : 0}
                {filters.starredOnly ? "+" : ""}
              </Badge>
            )}
          </Button>
          <FilterDropdown
            open={open}
            onClose={() => setOpen(false)}
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        </div>
      </div>
    </div>
  );
}

export default SearchFilterBar;
