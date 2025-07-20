
import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

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

const TimelinePage: React.FC<TimelinePageProps> = ({ projectId }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res: TimelineEvent[] = await invoke("get_project_timeline", {
        projectId,
        offset: page * PAGE_SIZE,
        limit: PAGE_SIZE,
        search: search || null,
        eventTypes: null,
      });
      setEvents(res);
      // Optionally, fetch total count for pagination
      // setTotal(...)
    } catch (e) {
      setEvents([]);
    }
    setLoading(false);
  };


  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line
  }, [page, search, projectId]);

  // Real-time event listener for timeline_event_added
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen<TimelineEvent>("timeline_event_added", (event) => {
      // Optionally filter by projectId
      setEvents((prev) => [event.payload, ...prev]);
    }).then((fn) => { unlisten = fn; });
    return () => { if (unlisten) unlisten(); };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Timeline</h1>
      <div className="mb-4 flex gap-2 items-center">
        <input
          className="border px-2 py-1 rounded"
          placeholder="Search events..."
          value={search}
          onChange={e => { setPage(0); setSearch(e.target.value); }}
        />
        <button
          className="ml-2 px-3 py-1 bg-gray-200 rounded"
          onClick={() => fetchEvents()}
        >
          Search
        </button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {events.length === 0 ? (
            <div className="text-gray-500">No events found.</div>
          ) : (
            <ul className="divide-y">
              {events.map(ev => (
                <li key={ev.id} className="py-3">
                  <div className="font-semibold">{ev.title}</div>
                  <div className="text-xs text-gray-500">{new Date(ev.timestamp).toLocaleString()}</div>
                  {ev.description && <div className="text-sm mt-1">{ev.description}</div>}
                  <div className="text-xs text-gray-400 mt-1">{ev.event_type && typeof ev.event_type === 'object' ? JSON.stringify(ev.event_type) : String(ev.event_type)}</div>
                  {ev.tags && ev.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {ev.tags.map(tag => (
                        <span key={tag} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 mt-4">
            <button
              className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >Prev</button>
            <span>Page {page + 1}</span>
            <button
              className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
              onClick={() => setPage(p => p + 1)}
              disabled={events.length < PAGE_SIZE}
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelinePage;
