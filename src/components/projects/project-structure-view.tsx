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
    <div>
      <div
        className={`flex items-center gap-2 p-2 hover:bg-muted cursor-pointer rounded-md transition-colors ${level > 0 ? "ml-4" : ""}`}
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
        <span className="text-sm font-medium">{name}</span>
      </div>
      {isExpanded && children && <div className="ml-2">{children}</div>}
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
    <Card className="p-4">
      <CardHeader className="p-0 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-base">Project Structure</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHidden(!showHidden)}
          className="gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {showHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showHidden ? "Hide" : "Show"} hidden
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-96">
          {renderStructure(structure)}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
