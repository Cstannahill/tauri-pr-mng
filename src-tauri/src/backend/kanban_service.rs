use crate::backend::kanban::*;
use rusqlite::{params, Connection, Result as SqlResult};
use std::sync::{Arc, Mutex};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde_json;

pub struct KanbanService {
    db: Arc<Mutex<Connection>>,
}

impl KanbanService {
    pub fn new(db_path: &str) -> Self {
        let conn = Connection::open(db_path).expect("Failed to open kanban DB");
        conn.execute_batch(r#"
            CREATE TABLE IF NOT EXISTS kanban_tasks (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT NOT NULL,
                priority TEXT NOT NULL,
                assignee TEXT,
                tags TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                due_date TEXT,
                estimated_hours REAL,
                metadata TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_kanban_project_id ON kanban_tasks(project_id);
            CREATE INDEX IF NOT EXISTS idx_kanban_status ON kanban_tasks(status);
        "#).unwrap();
        Self { db: Arc::new(Mutex::new(conn)) }
    }

    pub fn create_task(&self, task: &KanbanTask) -> SqlResult<()> {
        let db = self.db.lock().unwrap();
        db.execute(
            "INSERT INTO kanban_tasks (id, project_id, title, description, status, priority, assignee, tags, created_at, updated_at, due_date, estimated_hours, metadata)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                task.id.to_string(),
                task.project_id.to_string(),
                task.title,
                task.description,
                task.status.to_string(),
                task.priority.to_string(),
                task.assignee,
                serde_json::to_string(&task.tags).unwrap(),
                task.created_at.to_rfc3339(),
                task.updated_at.to_rfc3339(),
                task.due_date.map(|d| d.to_rfc3339()),
                task.estimated_hours,
                serde_json::to_string(&task.metadata).unwrap(),
            ]
        )?;
        Ok(())
    }

    pub fn update_task(&self, task: &KanbanTask) -> SqlResult<()> {
        let db = self.db.lock().unwrap();
        db.execute(
            "UPDATE kanban_tasks SET title = ?2, description = ?3, status = ?4, priority = ?5, assignee = ?6, tags = ?7, updated_at = ?8, due_date = ?9, estimated_hours = ?10, metadata = ?11
            WHERE id = ?1",
            params![
                task.id.to_string(),
                task.title,
                task.description,
                task.status.to_string(),
                task.priority.to_string(),
                task.assignee,
                serde_json::to_string(&task.tags).unwrap(),
                task.updated_at.to_rfc3339(),
                task.due_date.map(|d| d.to_rfc3339()),
                task.estimated_hours,
                serde_json::to_string(&task.metadata).unwrap(),
            ]
        )?;
        Ok(())
    }

    pub fn delete_task(&self, task_id: Uuid) -> SqlResult<()> {
        let db = self.db.lock().unwrap();
        db.execute("DELETE FROM kanban_tasks WHERE id = ?1", params![task_id.to_string()])?;
        Ok(())
    }

    pub fn get_project_tasks(&self, project_id: Uuid) -> SqlResult<Vec<KanbanTask>> {
        let db = self.db.lock().unwrap();
        let mut stmt = db.prepare("SELECT * FROM kanban_tasks WHERE project_id = ?1 ORDER BY created_at DESC")?;
        let mut rows = stmt.query(params![project_id.to_string()])?;

        let mut tasks = Vec::new();
        while let Some(row) = rows.next()? {
            let task = KanbanTask {
                id: Uuid::parse_str(row.get::<_, String>(0)?.as_str()).unwrap(),
                project_id: Uuid::parse_str(row.get::<_, String>(1)?.as_str()).unwrap(),
                title: row.get(2)?,
                description: row.get(3)?,
                status: TaskStatus::from_string(&row.get::<_, String>(4)?),
                priority: TaskPriority::from_string(&row.get::<_, String>(5)?),
                assignee: row.get(6)?,
                tags: serde_json::from_str(&row.get::<_, String>(7)?).unwrap_or_default(),
                created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?).unwrap().with_timezone(&Utc),
                updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(9)?).unwrap().with_timezone(&Utc),
                due_date: row.get::<_, Option<String>>(10)?.map(|s| DateTime::parse_from_rfc3339(&s).unwrap().with_timezone(&Utc)),
                estimated_hours: row.get(11)?,
                metadata: serde_json::from_str(&row.get::<_, String>(12)?).unwrap_or_default(),
            };
            tasks.push(task);
        }
        Ok(tasks)
    }

    pub fn get_kanban_board(&self, project_id: Uuid) -> SqlResult<KanbanBoard> {
        let tasks = self.get_project_tasks(project_id)?;
        
        let mut columns = vec![
            KanbanColumn {
                id: "todo".to_string(),
                title: "To Do".to_string(),
                status: TaskStatus::Todo,
                tasks: Vec::new(),
            },
            KanbanColumn {
                id: "in_progress".to_string(),
                title: "In Progress".to_string(),
                status: TaskStatus::InProgress,
                tasks: Vec::new(),
            },
            KanbanColumn {
                id: "review".to_string(),
                title: "Review".to_string(),
                status: TaskStatus::Review,
                tasks: Vec::new(),
            },
            KanbanColumn {
                id: "done".to_string(),
                title: "Done".to_string(),
                status: TaskStatus::Done,
                tasks: Vec::new(),
            },
            KanbanColumn {
                id: "blocked".to_string(),
                title: "Blocked".to_string(),
                status: TaskStatus::Blocked,
                tasks: Vec::new(),
            },
        ];

        for task in tasks {
            for column in columns.iter_mut() {
                if column.status == task.status {
                    column.tasks.push(task);
                    break;
                }
            }
        }

        Ok(KanbanBoard {
            project_id,
            columns,
        })
    }

    pub fn move_task(&self, task_id: Uuid, new_status: TaskStatus) -> SqlResult<()> {
        let db = self.db.lock().unwrap();
        db.execute(
            "UPDATE kanban_tasks SET status = ?1, updated_at = ?2 WHERE id = ?3",
            params![
                new_status.to_string(),
                Utc::now().to_rfc3339(),
                task_id.to_string()
            ]
        )?;
        Ok(())
    }
}