use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use serde_json::Value;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct KanbanTask {
    pub id: Uuid,
    pub project_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: TaskPriority,
    pub assignee: Option<String>,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub due_date: Option<DateTime<Utc>>,
    pub estimated_hours: Option<f32>,
    pub metadata: HashMap<String, Value>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum TaskStatus {
    Todo,
    InProgress, 
    Review,
    Done,
    Blocked,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum TaskPriority {
    Low,
    Medium,
    High,
    Urgent,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct KanbanColumn {
    pub id: String,
    pub title: String,
    pub status: TaskStatus,
    pub tasks: Vec<KanbanTask>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct KanbanBoard {
    pub project_id: Uuid,
    pub columns: Vec<KanbanColumn>,
}

impl Default for TaskStatus {
    fn default() -> Self {
        TaskStatus::Todo
    }
}

impl Default for TaskPriority {
    fn default() -> Self {
        TaskPriority::Medium
    }
}

impl ToString for TaskStatus {
    fn to_string(&self) -> String {
        match self {
            TaskStatus::Todo => "todo".to_string(),
            TaskStatus::InProgress => "in_progress".to_string(),
            TaskStatus::Review => "review".to_string(),
            TaskStatus::Done => "done".to_string(),
            TaskStatus::Blocked => "blocked".to_string(),
        }
    }
}

impl ToString for TaskPriority {
    fn to_string(&self) -> String {
        match self {
            TaskPriority::Low => "low".to_string(),
            TaskPriority::Medium => "medium".to_string(),
            TaskPriority::High => "high".to_string(),
            TaskPriority::Urgent => "urgent".to_string(),
        }
    }
}

impl TaskStatus {
    pub fn from_string(s: &str) -> Self {
        match s {
            "todo" => TaskStatus::Todo,
            "in_progress" => TaskStatus::InProgress,
            "review" => TaskStatus::Review,
            "done" => TaskStatus::Done,
            "blocked" => TaskStatus::Blocked,
            _ => TaskStatus::Todo,
        }
    }
}

impl TaskPriority {
    pub fn from_string(s: &str) -> Self {
        match s {
            "low" => TaskPriority::Low,
            "medium" => TaskPriority::Medium,
            "high" => TaskPriority::High,
            "urgent" => TaskPriority::Urgent,
            _ => TaskPriority::Medium,
        }
    }
}