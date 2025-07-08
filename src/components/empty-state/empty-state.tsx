import React from "react";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto mb-4 w-16 h-16 text-muted-foreground flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-medium mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}

export default EmptyState;
