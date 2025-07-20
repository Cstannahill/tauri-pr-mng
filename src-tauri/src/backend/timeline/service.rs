use super::model::*;
use rusqlite::{params, Connection, Result as SqlResult};
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde_json::Value;
use std::collections::HashMap;

pub struct TimelineService {
    db: Arc<RwLock<Connection>>,
}

impl TimelineService {
    pub fn new(db_path: &str) -> Self {
        let conn = Connection::open(db_path).expect("Failed to open timeline DB");
        conn.execute_batch(
            """
            CREATE TABLE IF NOT EXISTS timeline_events (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                event_type TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                metadata TEXT,
                user_id TEXT,
                tags TEXT
            );
            """
        ).unwrap();
        Self { db: Arc::new(RwLock::new(conn)) }
    }

    pub async fn add_event(&self, event: &TimelineEvent) -> SqlResult<()> {
        let db = self.db.write().await;
        db.execute(
            "INSERT INTO timeline_events (id, project_id, timestamp, event_type, title, description, metadata, user_id, tags)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                event.id.to_string(),
                event.project_id.to_string(),
                event.timestamp.to_rfc3339(),
                serde_json::to_string(&event.event_type).unwrap(),
                event.title,
                event.description,
                serde_json::to_string(&event.metadata).unwrap(),
                event.user_id,
                serde_json::to_string(&event.tags).unwrap(),
            ]
        )?;
        Ok(())
    }

    pub async fn get_project_timeline(
        &self,
        project_id: Uuid,
        offset: usize,
        limit: usize,
        search: Option<String>,
        event_types: Option<Vec<String>>,
    ) -> SqlResult<Vec<TimelineEvent>> {
        let db = self.db.read().await;
        let mut query = String::from("SELECT * FROM timeline_events WHERE project_id = ?1");
        if let Some(ref s) = search {
            query.push_str(" AND (title LIKE ?2 OR description LIKE ?2)");
        }
        if let Some(ref types) = event_types {
            let placeholders = types.iter().map(|_| "?".to_string()).collect::<Vec<_>>().join(",");
            query.push_str(&format!(" AND event_type IN ({})", placeholders));
        }
        query.push_str(" ORDER BY timestamp DESC LIMIT ?3 OFFSET ?4");

        let mut stmt = db.prepare(&query)?;
        let mut rows = stmt.query(params![
            project_id.to_string(),
            search.as_ref().map(|s| format!("%{}%", s)),
            limit as i64,
            offset as i64
        ])?;

        let mut events = Vec::new();
        while let Some(row) = rows.next()? {
            let event = TimelineEvent {
                id: Uuid::parse_str(row.get::<_, String>(0)?.as_str()).unwrap(),
                project_id: Uuid::parse_str(row.get::<_, String>(1)?.as_str()).unwrap(),
                timestamp: DateTime::parse_from_rfc3339(&row.get::<_, String>(2)?).unwrap().with_timezone(&Utc),
                event_type: serde_json::from_str(&row.get::<_, String>(3)?).unwrap(),
                title: row.get(4)?,
                description: row.get(5)?,
                metadata: serde_json::from_str(&row.get::<_, String>(6)?).unwrap(),
                user_id: row.get(7)?,
                tags: serde_json::from_str(&row.get::<_, String>(8)?).unwrap(),
            };
            events.push(event);
        }
        Ok(events)
    }
}
