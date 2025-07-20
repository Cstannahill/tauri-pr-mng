use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use serde_json::Value;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TimelineEvent {
    pub id: Uuid,
    pub project_id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub event_type: TimelineEventType,
    pub title: String,
    pub description: Option<String>,
    pub metadata: HashMap<String, Value>,
    pub user_id: Option<String>,
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum TimelineEventType {
    ProjectCreated,
    ProjectModified,
    FileAdded { path: String, size: u64 },
    FileModified { path: String },
    GitCommit { hash: String, message: String },
    BuildCompleted { status: String },
    Custom { event_name: String },
}
