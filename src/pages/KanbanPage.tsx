import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Calendar, User, Clock, MoreHorizontal, Edit, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

interface KanbanTaskType {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  due_date?: string;
  estimated_hours?: number;
  metadata: Record<string, any>;
}

interface KanbanColumnType {
  id: string;
  title: string;
  status: string;
  tasks: KanbanTaskType[];
}

interface KanbanBoardType {
  project_id: string;
  columns: KanbanColumnType[];
}

interface KanbanPageProps {
  projectId: string;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};

const statusColors = {
  todo: 'bg-gray-100 border-gray-300',
  in_progress: 'bg-blue-50 border-blue-300',
  review: 'bg-yellow-50 border-yellow-300',
  done: 'bg-green-50 border-green-300',
  blocked: 'bg-red-50 border-red-300',
};

const KanbanPage: React.FC<KanbanPageProps> = ({ projectId }) => {
  const [board, setBoard] = useState<KanbanBoardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<KanbanTaskType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTaskType | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignee: '',
    tags: [] as string[],
    due_date: '',
    estimated_hours: 0,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    loadKanbanBoard();
  }, [projectId]);

  const loadKanbanBoard = async () => {
    setLoading(true);
    try {
      const boardData: KanbanBoardType = await invoke('get_kanban_board', { projectId });
      setBoard(boardData);
    } catch (error) {
      console.error('Failed to load kanban board:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findTaskById(active.id as string);
    setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    // Find the task and its current status
    const task = findTaskById(taskId);
    if (!task || task.status === newStatus) return;

    // Update task status locally first for immediate feedback
    setBoard(prev => {
      if (!prev) return prev;
      const newBoard = { ...prev };
      newBoard.columns = newBoard.columns.map(column => ({
        ...column,
        tasks: column.tasks.filter(t => t.id !== taskId)
      }));
      
      const targetColumn = newBoard.columns.find(col => col.id === newStatus);
      if (targetColumn) {
        targetColumn.tasks.push({ ...task, status: newStatus });
      }
      
      return newBoard;
    });

    // Update on backend
    moveTask(taskId, newStatus);
  };

  const findTaskById = (taskId: string): KanbanTaskType | null => {
    if (!board) return null;
    for (const column of board.columns) {
      const task = column.tasks.find(t => t.id === taskId);
      if (task) return task;
    }
    return null;
  };

  const moveTask = async (taskId: string, newStatus: string) => {
    try {
      await invoke('move_kanban_task', { taskId, newStatus });
    } catch (error) {
      console.error('Failed to move task:', error);
      // Reload board to get the correct state
      loadKanbanBoard();
    }
  };

  const createTask = async () => {
    try {
      const createdTask: KanbanTaskType = await invoke('create_kanban_task', {
        projectId,
        title: newTask.title,
        description: newTask.description || null,
        priority: newTask.priority,
        assignee: newTask.assignee || null,
        tags: newTask.tags,
        dueDate: newTask.due_date || null,
        estimatedHours: newTask.estimated_hours || null,
      });

      setBoard(prev => {
        if (!prev) return prev;
        const newBoard = { ...prev };
        const todoColumn = newBoard.columns.find(col => col.id === 'todo');
        if (todoColumn) {
          todoColumn.tasks.unshift(createdTask);
        }
        return newBoard;
      });

      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        assignee: '',
        tags: [],
        due_date: '',
        estimated_hours: 0,
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await invoke('delete_kanban_task', { taskId });
      setBoard(prev => {
        if (!prev) return prev;
        const newBoard = { ...prev };
        newBoard.columns = newBoard.columns.map(column => ({
          ...column,
          tasks: column.tasks.filter(t => t.id !== taskId)
        }));
        return newBoard;
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span className="ml-2 text-muted-foreground">Loading kanban board...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Kanban Board</h2>
          <p className="text-muted-foreground">Organize and track your project tasks</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Task title..."
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Task description..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="assignee">Assignee</Label>
                  <Input
                    id="assignee"
                    value={newTask.assignee}
                    onChange={(e) => setNewTask(prev => ({ ...prev, assignee: e.target.value }))}
                    placeholder="Assignee..."
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={createTask} disabled={!newTask.title.trim()}>
                  Create Task
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {board && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-4">
            {board.columns.map((column) => (
              <div key={column.id} className="flex-shrink-0 w-80">
                <Card className={`h-full ${statusColors[column.id] || statusColors.todo}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-sm font-semibold">
                      <span>{column.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {column.tasks.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SortableContext items={column.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      <ScrollArea className="h-[calc(100vh-300px)]">
                        <div className="space-y-3">
                          {column.tasks.map((task) => (
                            <Card key={task.id} className="cursor-move hover:shadow-md transition-shadow bg-white">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                          <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setEditingTask(task)}>
                                          <Edit className="w-4 h-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-600">
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center justify-between">
                                    <Badge className={`text-xs ${priorityColors[task.priority] || priorityColors.medium}`}>
                                      {task.priority}
                                    </Badge>
                                    
                                    {task.assignee && (
                                      <div className="flex items-center gap-1">
                                        <User className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">{task.assignee}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {task.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {task.tags.map(tag => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {(task.due_date || task.estimated_hours) && (
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      {task.due_date && (
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          <span>{formatDate(task.due_date)}</span>
                                        </div>
                                      )}
                                      {task.estimated_hours && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          <span>{task.estimated_hours}h</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </SortableContext>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          
          <DragOverlay>
            {activeTask && (
              <Card className="cursor-move shadow-lg bg-white opacity-90">
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm">{activeTask.title}</h4>
                  <Badge className={`text-xs mt-2 ${priorityColors[activeTask.priority] || priorityColors.medium}`}>
                    {activeTask.priority}
                  </Badge>
                </CardContent>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
};

export default KanbanPage;
