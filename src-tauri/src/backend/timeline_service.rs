use crate::backend::timeline::*;
use rusqlite::{params, Connection, Result as SqlResult};
use std::sync::{Arc, Mutex};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde_json::json;

pub struct TimelineService {
    db: Arc<Mutex<Connection>>,
}

impl TimelineService {
    pub fn new(db_path: &str) -> Self {
        let conn = Connection::open(db_path).expect("Failed to open timeline DB");
        conn.execute_batch(r#"
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
        "#).unwrap();
        Self { db: Arc::new(Mutex::new(conn)) }
    }

    pub fn add_event(&self, event: &TimelineEvent) -> SqlResult<()> {
        let db = self.db.lock().unwrap();
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

    pub fn get_project_timeline(
        &self,
        project_id: Uuid,
        offset: usize,
        limit: usize,
        search: Option<String>,
        event_types: Option<Vec<String>>,
    ) -> SqlResult<Vec<TimelineEvent>> {
        let db = self.db.lock().unwrap();
        let mut query = String::from("SELECT * FROM timeline_events WHERE project_id = ?1");
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(project_id.to_string())];
        let mut param_index = 2;
        if let Some(ref s) = search {
            query.push_str(&format!(" AND (title LIKE ?{} OR description LIKE ?{})", param_index, param_index));
            params_vec.push(Box::new(format!("%{}%", s)));
            param_index += 1;
        }
        if let Some(ref types) = event_types {
            let placeholders = (0..types.len()).map(|i| format!("?{}", param_index + i)).collect::<Vec<_>>().join(",");
            query.push_str(&format!(" AND event_type IN ({})", placeholders));
            for t in types {
                params_vec.push(Box::new(t.clone()));
            }
            param_index += types.len();
        }
        query.push_str(&format!(" ORDER BY timestamp DESC LIMIT ?{} OFFSET ?{}", param_index, param_index + 1));
        params_vec.push(Box::new(limit as i64));
        params_vec.push(Box::new(offset as i64));

        let mut stmt = db.prepare(&query)?;
        let mut rows = stmt.query(rusqlite::params_from_iter(params_vec.iter().map(|b| &**b)))?;

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
