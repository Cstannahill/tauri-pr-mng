import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export interface FilterDropdownProps {
  open: boolean;
  onClose: () => void;
  filters: { types: string[]; starredOnly: boolean };
  onFiltersChange: (filters: { types: string[]; starredOnly: boolean }) => void;
}

export function FilterDropdown({ open, onClose, filters, onFiltersChange }: FilterDropdownProps) {
  if (!open) return null;

  const toggleType = (type: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({ ...filters, types: [...filters.types, type] });
    } else {
      onFiltersChange({ ...filters, types: filters.types.filter((t) => t !== type) });
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
      <div className="p-4 space-y-4">
        <h3 className="font-semibold">Filters</h3>
        <div>
          <p className="block text-sm font-medium text-muted-foreground mb-2">
            Project Type
          </p>
          <div className="space-y-2">
            {['all', 'rust', 'tauri', 'react', 'next', 'node', 'python'].map((type) => (
              <label key={type} className="flex items-center gap-2">
                <Checkbox
                  checked={filters.types.includes(type)}
                  onCheckedChange={(checked) => toggleType(type, Boolean(checked))}
                />
                <span className="text-sm capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={filters.starredOnly}
              onCheckedChange={(checked) =>
                onFiltersChange({ ...filters, starredOnly: Boolean(checked) })
              }
            />
            <span className="text-sm">Starred only</span>
          </label>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onFiltersChange({ types: ['all'], starredOnly: false })}
          >
            Clear
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
