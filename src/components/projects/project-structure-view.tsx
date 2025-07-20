import React, { useState } from "react"
import {
  Folder,
  FolderOpen,
  File,
  ChevronRight,
  ChevronDown,
  Layers,
  Eye,
  EyeOff,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface ProjectStructureViewProps {
  project: any
  structure: Record<string, any>
}

interface TreeNodeProps {
  name: string
  isFolder: boolean
  isExpanded: boolean
  onToggle: () => void
  level?: number
  icon?: React.ReactNode
  children?: React.ReactNode
}

function TreeNode({
  name,
  isFolder,
  isExpanded,
  onToggle,
  children,
  level = 0,
  icon,
}: TreeNodeProps) {
  return (
    <div className="bg-sidebar">
      <div
        className={`flex items-center gap-2 py-1.5 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer rounded-md transition-colors bg-sidebar ${level > 0 ? `ml-${Math.min(level * 4, 16)}` : ""}`}
        onClick={onToggle}
      >
        {isFolder && (
          <div className="w-4 h-4 flex items-center justify-center">
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </div>
        )}
        {icon ||
          (isFolder ? (
            isExpanded ? <FolderOpen className="w-4 h-4 text-primary" /> : <Folder className="w-4 h-4 text-primary" />
          ) : (
            <File className="w-4 h-4 text-muted-foreground" />
          ))}
        <span className="text-sm font-medium text-sidebar-foreground">{name}</span>
      </div>
      {isExpanded && children && <div className="ml-2 bg-sidebar">{children}</div>}
    </div>
  )
}

export function ProjectStructureView({ project, structure }: ProjectStructureViewProps) {
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({})
  const [showHidden, setShowHidden] = useState(false)

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => ({ ...prev, [path]: !prev[path] }))
  }

  const isHidden = (name: string) => name.startsWith(".")

  const renderStructure = (obj: any, path = "", level = 0): React.ReactNode => {
    if (!obj || typeof obj !== "object") return null

    const entries = Object.entries(obj)
      .filter(([key]) => showHidden || !isHidden(key))
      .sort(([aKey, aValue], [bKey, bValue]) => {
        const aIsFolder = aValue !== "file" && typeof aValue === "object"
        const bIsFolder = bValue !== "file" && typeof bValue === "object"
        if (aIsFolder && !bIsFolder) return -1
        if (!aIsFolder && bIsFolder) return 1
        return aKey.localeCompare(bKey)
      })

    return entries.map(([key, value]) => {
        const currentPath = path ? `${path}/${key}` : key
        const isFolder = value !== "file" && typeof value === "object"
        const isExpanded = expandedPaths[currentPath]

        return (
          <TreeNode
            key={currentPath}
            name={key}
            isFolder={isFolder}
            isExpanded={isExpanded}
            onToggle={() => isFolder && togglePath(currentPath)}
            level={level}
          >
            {isFolder && isExpanded && renderStructure(value, currentPath, level + 1)}
          </TreeNode>
        )
      })
  }

  return (
    <Card className="bg-sidebar border-sidebar-border flex-1 min-h-fit">
      <CardHeader className="p-3 mb-2 flex items-center justify-between bg-sidebar">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-sidebar-foreground" />
          <CardTitle className="text-base text-sidebar-foreground">Project Structure</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHidden(!showHidden)}
          className="gap-1 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {showHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showHidden ? "Hide" : "Show"} hidden
        </Button>
      </CardHeader>
      <CardContent className="p-0 px-3 pb-3 bg-sidebar flex-1">
        <div className="space-y-0.5 pb-2 bg-sidebar">
          {renderStructure(structure)}
          {/* Add some padding at the bottom to ensure background extends */}
          <div className="h-4 bg-sidebar"></div>
        </div>
      </CardContent>
    </Card>
  )
}
