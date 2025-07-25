
import React, { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Search, Filter, Calendar, GitCommit, FileText, Folder, User, Tag, Clock, ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

type TimelineEvent = {
  id: string;
  project_id: string;
  timestamp: string;
  event_type: any;
  title: string;
  description?: string;
  metadata: Record<string, any>;
  user_id?: string;
  tags: string[];
};

const PAGE_SIZE = 20;

interface TimelinePageProps {
  projectId: string;
}

const getEventIcon = (eventType: any) => {
  if (typeof eventType === 'object') {
    if (eventType.GitCommit) return <GitCommit className="w-4 h-4" />;
    if (eventType.ProjectCreated) return <Folder className="w-4 h-4" />;
    if (eventType.ProjectModified) return <FileText className="w-4 h-4" />;
    if (eventType.FileAdded) return <FileText className="w-4 h-4" />;
    if (eventType.FileModified) return <FileText className="w-4 h-4" />;
    if (eventType.BuildCompleted) return <FileText className="w-4 h-4" />;
  }
  return <FileText className="w-4 h-4" />;
};

const getEventColor = (eventType: any) => {
  if (typeof eventType === 'object') {
    if (eventType.GitCommit) return "text-green-600 bg-green-50 border-green-200";
    if (eventType.ProjectCreated) return "text-blue-600 bg-blue-50 border-blue-200";
    if (eventType.ProjectModified) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (eventType.FileAdded) return "text-purple-600 bg-purple-50 border-purple-200";
    if (eventType.FileModified) return "text-orange-600 bg-orange-50 border-orange-200";
    if (eventType.BuildCompleted) return "text-indigo-600 bg-indigo-50 border-indigo-200";
  }
  return "text-gray-600 bg-gray-50 border-gray-200";
};

const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const eventTime = new Date(timestamp);
  const diffMs = now.getTime() - eventTime.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return eventTime.toLocaleDateString();
};

const TimelinePage: React.FC<TimelinePageProps> = ({ projectId }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res: TimelineEvent[] = await invoke("get_project_timeline", {
        projectId,
        offset: page * PAGE_SIZE,
        limit: PAGE_SIZE,
        search: search || null,
        eventTypes: eventTypeFilter === "all" ? null : [eventTypeFilter],
      });
      setEvents(res);
    } catch (e) {
      setEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line
  }, [page, search, projectId, eventTypeFilter]);

  // Real-time event listener for timeline_event_added
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen<TimelineEvent>("timeline_event_added", (event) => {
      if (event.payload.project_id === projectId) {
        setEvents((prev) => [event.payload, ...prev]);
      }
    }).then((fn) => { unlisten = fn; });
    return () => { if (unlisten) unlisten(); };
  }, [projectId]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    events.forEach(event => {
      event.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (tagFilter === "all") return true;
      return event.tags.includes(tagFilter);
    });
  }, [events, tagFilter]);

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const renderEventDetails = (event: TimelineEvent) => {
    const details = [];
    
    if (event.metadata && Object.keys(event.metadata).length > 0) {
      details.push(
        <div key="metadata" className="mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Metadata:</p>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        </div>
      );
    }

    if (event.user_id) {
      details.push(
        <div key="user" className="mt-2 flex items-center gap-2">
          <User className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">User: {event.user_id}</span>
        </div>
      );
    }

    return details;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Project Timeline</h2>
        <p className="text-muted-foreground">Track all events and changes in your project</p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search events..."
                value={search}
                onChange={(e) => {
                  setPage(0);
                  setSearch(e.target.value);
                }}
                className="pl-9"
              />
            </div>
            
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="GitCommit">Git Commits</SelectItem>
                <SelectItem value="ProjectCreated">Project Created</SelectItem>
                <SelectItem value="ProjectModified">Project Modified</SelectItem>
                <SelectItem value="FileAdded">File Added</SelectItem>
                <SelectItem value="FileModified">File Modified</SelectItem>
                <SelectItem value="BuildCompleted">Build Completed</SelectItem>
              </SelectContent>
            </Select>

            {availableTags.length > 0 && (
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-[140px]">
                  <Tag className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {availableTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button onClick={fetchEvents} variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Events Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="ml-2 text-muted-foreground">Loading events...</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No events found</h3>
              <p className="text-muted-foreground">
                {search || eventTypeFilter !== "all" || tagFilter !== "all" 
                  ? "Try adjusting your filters to see more events."
                  : "This project doesn't have any timeline events yet."}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-4">
                {filteredEvents.map((event, index) => (
                  <div key={event.id} className="relative">
                    {/* Timeline line */}
                    {index < filteredEvents.length - 1 && (
                      <div className="absolute left-4 top-12 bottom-0 w-px bg-border"></div>
                    )}
                    
                    <div className={`flex gap-4 p-4 rounded-lg border ${getEventColor(event.event_type)}`}>
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-background border-2 border-current flex items-center justify-center">
                          {getEventIcon(event.event_type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm leading-tight">{event.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatRelativeTime(event.timestamp)} • {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                          
                          {(event.description || event.metadata || event.user_id) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleEventExpansion(event.id)}
                              className="flex-shrink-0"
                            >
                              {expandedEvents.has(event.id) ? 
                                <ChevronDown className="w-4 h-4" /> : 
                                <ChevronRight className="w-4 h-4" />
                              }
                            </Button>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm mt-2 text-foreground/80">{event.description}</p>
                        )}

                        {event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {event.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Collapsible open={expandedEvents.has(event.id)}>
                          <CollapsibleContent>
                            {renderEventDetails(event)}
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {filteredEvents.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm text-muted-foreground">
                    Page {page + 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={events.length < PAGE_SIZE}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimelinePage;
