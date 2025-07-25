/// Tauri command to get the latest commit hash for a project directory
#[tauri::command]
pub fn get_latest_commit_hash(project_path: String) -> Result<String, String> {
    use std::process::Command;
    let output = Command::new("git")
        .args(["rev-parse", "HEAD"])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to run git rev-parse: {}", e))?;
    if !output.status.success() {
        return Err(format!("git rev-parse failed: {}", String::from_utf8_lossy(&output.stderr)));
    }
    let hash = String::from_utf8_lossy(&output.stdout).trim().to_string();
    Ok(hash)
}
use std::fs;
use std::fs::File;
use std::io::{Read, Write};
use tauri::Manager;
use tauri::Emitter;
/// Get or create a persistent UUID for a project directory
#[tauri::command]
pub fn get_or_create_project_uuid(project_path: String) -> Result<String, String> {
    let id_path = std::path::Path::new(&project_path).join(".project_id");
    if id_path.exists() {
        let mut s = String::new();
        File::open(&id_path)
            .map_err(|e| format!("Failed to open .project_id: {}", e))?
            .read_to_string(&mut s)
            .map_err(|e| format!("Failed to read .project_id: {}", e))?;
        let s = s.trim();
        if Uuid::parse_str(s).is_ok() {
            return Ok(s.to_string());
        }
    }
    let new_id = Uuid::new_v4().to_string();
    File::create(&id_path)
        .and_then(|mut f| f.write_all(new_id.as_bytes()))
        .map_err(|e| format!("Failed to write .project_id: {}", e))?;
    Ok(new_id)
}
/// Tauri command to trigger handle_git_commit_timeline from CLI/HTTP
#[tauri::command]
pub async fn trigger_git_commit_timeline(
    app_handle: tauri::AppHandle,
    project_id: String,
    project_path: String,
    commit_hash: String,
    openai_key: String,
    state: tauri::State<'_, TimelineService>,
) -> Result<(), String> {
    let uuid = Uuid::parse_str(&project_id).map_err(|e| e.to_string())?;
    handle_git_commit_timeline(
        app_handle,
        uuid,
        &project_path,
        &commit_hash,
        &openai_key,
        &state,
    ).await
}
use crate::backend::timeline_ai::generate_commit_summary;
use std::process::Command;
/// Call this after a git commit to generate and emit a timeline event using AI
pub async fn handle_git_commit_timeline(
    app_handle: tauri::AppHandle,
    project_id: uuid::Uuid,
    project_path: &str,
    commit_hash: &str,
    openai_key: &str,
    timeline_service: &crate::backend::timeline_service::TimelineService,
) -> Result<(), String> {
    // 1. Read project summary (e.g., SUMMARY.md)
    let summary_path = std::path::Path::new(project_path).join("SUMMARY.md");
    let project_summary = std::fs::read_to_string(&summary_path).unwrap_or_default();

    // 2. Get commit diff
    let diff_output = Command::new("git")
        .args(["diff-tree", "-p", commit_hash])
        .current_dir(project_path)
        .output()
        .map_err(|e| format!("Failed to run git diff-tree: {}", e))?;
    let commit_diff = String::from_utf8_lossy(&diff_output.stdout).to_string();

    // 3. Call AI to generate summary
    let summary = generate_commit_summary(&project_summary, &commit_diff, openai_key)
        .await
        .unwrap_or_else(|_| "Commit summary unavailable".to_string());

    // 4. Create and emit timeline event
    use crate::backend::timeline::{TimelineEvent, TimelineEventType};
    use chrono::Utc;
    let event = TimelineEvent {
        id: Uuid::new_v4(),
        project_id,
        timestamp: Utc::now(),
        event_type: TimelineEventType::GitCommit {
            hash: commit_hash.to_string(),
            message: summary.clone(),
        },
        title: format!("Commit {}", &commit_hash[..7]),
        description: Some(summary),
        metadata: Default::default(),
        user_id: None,
        tags: vec!["commit".to_string()],
    };
    app_handle.emit("timeline_event_added", &event).ok();
    timeline_service.add_event(&event).map_err(|e| e.to_string())?;
    Ok(())
}
use crate::app_state::AppState;
use tauri::State;
use std::sync::Mutex;
mod timeline;
pub mod timeline_service;
mod timeline_ai;
mod kanban;
pub mod kanban_service;
use timeline::*;
use timeline_service::TimelineService;
use kanban::*;
use kanban_service::KanbanService;
use uuid::Uuid;
use chrono::{DateTime, Utc};
// Timeline Tauri commands
#[tauri::command]
pub fn add_timeline_event(event: TimelineEvent, state: tauri::State<'_, TimelineService>) -> Result<(), String> {
    state.add_event(&event).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_project_timeline(
    project_id: String,
    offset: usize,
    limit: usize,
    search: Option<String>,
    event_types: Option<Vec<String>>,
    state: tauri::State<'_, TimelineService>
) -> Result<Vec<TimelineEvent>, String> {
    let uuid = Uuid::parse_str(&project_id).map_err(|e| e.to_string())?;
    state.get_project_timeline(uuid, offset, limit, search, event_types).map_err(|e| e.to_string())
}

// Kanban Tauri commands
#[tauri::command]
pub fn create_kanban_task(
    project_id: String,
    title: String,
    description: Option<String>,
    priority: String,
    assignee: Option<String>,
    tags: Vec<String>,
    due_date: Option<String>,
    estimated_hours: Option<f32>,
    state: tauri::State<'_, KanbanService>
) -> Result<KanbanTask, String> {
    let project_uuid = Uuid::parse_str(&project_id).map_err(|e| e.to_string())?;
    let task = KanbanTask {
        id: Uuid::new_v4(),
        project_id: project_uuid,
        title,
        description,
        status: TaskStatus::Todo,
        priority: TaskPriority::from_string(&priority),
        assignee,
        tags,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        due_date: due_date.and_then(|d| DateTime::parse_from_rfc3339(&d).ok().map(|dt| dt.with_timezone(&Utc))),
        estimated_hours,
        metadata: std::collections::HashMap::new(),
    };
    
    state.create_task(&task).map_err(|e| e.to_string())?;
    Ok(task)
}

#[tauri::command]
pub fn update_kanban_task(
    task_id: String,
    project_id: String,
    title: String,
    description: Option<String>,
    status: String,
    priority: String,
    assignee: Option<String>,
    tags: Vec<String>,
    due_date: Option<String>,
    estimated_hours: Option<f32>,
    state: tauri::State<'_, KanbanService>
) -> Result<(), String> {
    let task_uuid = Uuid::parse_str(&task_id).map_err(|e| e.to_string())?;
    let project_uuid = Uuid::parse_str(&project_id).map_err(|e| e.to_string())?;
    
    let updated_task = KanbanTask {
        id: task_uuid,
        project_id: project_uuid,
        title,
        description,
        status: TaskStatus::from_string(&status),
        priority: TaskPriority::from_string(&priority),
        assignee,
        tags,
        created_at: Utc::now(), // This should ideally be preserved from existing task
        updated_at: Utc::now(),
        due_date: due_date.and_then(|d| DateTime::parse_from_rfc3339(&d).ok().map(|dt| dt.with_timezone(&Utc))),
        estimated_hours,
        metadata: std::collections::HashMap::new(),
    };
    
    state.update_task(&updated_task).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_kanban_task(task_id: String, state: tauri::State<'_, KanbanService>) -> Result<(), String> {
    let task_uuid = Uuid::parse_str(&task_id).map_err(|e| e.to_string())?;
    state.delete_task(task_uuid).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_kanban_board(project_id: String, state: tauri::State<'_, KanbanService>) -> Result<KanbanBoard, String> {
    let project_uuid = Uuid::parse_str(&project_id).map_err(|e| e.to_string())?;
    state.get_kanban_board(project_uuid).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn move_kanban_task(
    task_id: String,
    new_status: String,
    state: tauri::State<'_, KanbanService>
) -> Result<(), String> {
    let task_uuid = Uuid::parse_str(&task_id).map_err(|e| e.to_string())?;
    let status = TaskStatus::from_string(&new_status);
    state.move_task(task_uuid, status).map_err(|e| e.to_string())
}
#[tauri::command]
pub fn create_category(_app_handle: tauri::AppHandle, name: String, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let mut app_state = state.lock().map_err(|_| "Failed to lock app state".to_string())?;
    let base_dir = &app_state.base_dir;
    let category_path = std::path::Path::new(base_dir).join(&name);
    fs::create_dir_all(&category_path).map_err(|e| format!("Failed to create category directory: {}", e))?;

    if !app_state.categories.contains(&name) {
        app_state.categories.push(name.clone());
        // If you want to persist categories to disk, do it here
    }
    Ok(())
}
// backend/mod.rs - shared backend commands for Tauri
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use tauri::AppHandle;

use crate::{file_ops, workspace};

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub name: String,
    pub path: String,
    pub project_type: String,
    pub last_modified: String,
    pub size: u64,
    pub files_count: usize,
    pub git_status: String,
    pub starred: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectCategory {
    pub name: String,
    pub path: String,
    pub projects: Vec<Project>,
}

#[tauri::command]
pub fn initialize_workspace(app_handle: AppHandle) -> Result<String, String> {
    let base = workspace::ensure_workspace(&app_handle)?;
    Ok(base.to_string_lossy().to_string())
}

#[tauri::command]
pub fn scan_projects(base_dir: String) -> Result<HashMap<String, Vec<Project>>, String> {
    let mut projects_map = HashMap::new();
    let base_path = Path::new(&base_dir);
    let starred = load_starred_projects().unwrap_or_default();

    // Dynamically find all subdirectories (categories)
    let categories = match fs::read_dir(base_path) {
        Ok(entries) => entries
            .filter_map(|entry| {
                entry.ok().and_then(|e| {
                    let path = e.path();
                    if path.is_dir() {
                        path.file_name().map(|n| n.to_string_lossy().to_string())
                    } else {
                        None
                    }
                })
            })
            .collect::<Vec<_>>(),
        Err(_) => vec![],
    };

    for category in categories.iter() {
        let category_path = base_path.join(category);
        let mut projects = Vec::new();

        if category_path.exists() && category_path.is_dir() {
            let entries = fs::read_dir(&category_path)
                .map_err(|e| format!("Failed to read directory {}: {}", category, e))?;

            for entry in entries {
                let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
                let path = entry.path();

                if path.is_dir() {
                    let project = scan_project_directory(&path, &starred)?;
                    projects.push(project);
                }
            }
        }

        projects_map.insert(category.to_string(), projects);
    }

    Ok(projects_map)
}

fn scan_project_directory(path: &Path, starred_set: &HashSet<String>) -> Result<Project, String> {
    let name = path
        .file_name()
        .ok_or("Invalid project directory name")?
        .to_string_lossy()
        .to_string();

    let metadata =
        fs::metadata(path).map_err(|e| format!("Failed to get metadata for {}: {}", name, e))?;

    let last_modified = metadata
        .modified()
        .map_err(|e| format!("Failed to get modification time: {}", e))?;

    let project_type = detect_project_type(path);
    let (size, files_count) = calculate_directory_stats(path)?;
    let git_status = get_git_status(path);
    let starred = starred_set.contains(&path.to_string_lossy().to_string());

    Ok(Project {
        name,
        path: path.to_string_lossy().to_string(),
        project_type,
        last_modified: format_system_time(last_modified),
        size,
        files_count,
        git_status,
        starred,
    })
}

fn detect_project_type(path: &Path) -> String {
    if path.join("Cargo.toml").exists() {
        if path.join("src-tauri").exists() {
            return "tauri".to_string();
        }
        return "rust".to_string();
    }

    if path.join("package.json").exists() {
        let package_json = fs::read_to_string(path.join("package.json")).unwrap_or_default();
        if package_json.contains("\"next\"") {
            return "next".to_string();
        }
        if package_json.contains("\"react\"") {
            return "react".to_string();
        }
        if package_json.contains("\"electron\"") {
            return "electron".to_string();
        }
        return "node".to_string();
    }

    if path.join("go.mod").exists() {
        return "go".to_string();
    }

    if path.join("requirements.txt").exists() || path.join("pyproject.toml").exists() {
        return "python".to_string();
    }

    if path.join("README.md").exists() {
        return "markdown".to_string();
    }

    "unknown".to_string()
}

fn calculate_directory_stats(path: &Path) -> Result<(u64, usize), String> {
    let mut total_size = 0;
    let mut files_count = 0;

    fn visit_dir(dir: &Path, size: &mut u64, count: &mut usize) -> std::io::Result<()> {
        if dir.is_dir() {
            for entry in fs::read_dir(dir)? {
                let entry = entry?;
                let path = entry.path();
                if path.is_dir() {
                    if let Some(name) = path.file_name() {
                        if name == "node_modules" || name == "target" || name == ".git" {
                            continue;
                        }
                    }
                    visit_dir(&path, size, count)?;
                } else {
                    *size += entry.metadata()?.len();
                    *count += 1;
                }
            }
        }
        Ok(())
    }

    visit_dir(path, &mut total_size, &mut files_count)
        .map_err(|e| format!("Failed to calculate directory stats: {}", e))?;

    Ok((total_size, files_count))
}

fn format_system_time(time: std::time::SystemTime) -> String {
    use chrono::{DateTime, Utc};
    use std::time::UNIX_EPOCH;

    let duration = time.duration_since(UNIX_EPOCH).unwrap();
    let datetime = DateTime::<Utc>::from_timestamp(duration.as_secs() as i64, 0)
        .unwrap_or_else(|| DateTime::from_timestamp(0, 0).unwrap());

    datetime.format("%Y-%m-%d %H:%M:%S").to_string()
}

fn get_git_status(path: &Path) -> String {
    use std::process::Command;

    if !path.join(".git").exists() {
        return "clean".to_string();
    }

    let output = Command::new("git")
        .args([
            "-C",
            path.to_str().unwrap_or(""),
            "status",
            "--porcelain",
            "--branch",
        ])
        .output();

    if let Ok(out) = output {
        if out.status.success() {
            let stdout = String::from_utf8_lossy(&out.stdout);
            let mut state = "clean".to_string();
            for (i, line) in stdout.lines().enumerate() {
                if i == 0 && line.starts_with("##") {
                    if line.contains("ahead") && line.contains("behind") {
                        state = "diverged".into();
                    } else if line.contains("ahead") {
                        state = "ahead".into();
                    } else if line.contains("behind") {
                        state = "behind".into();
                    }
                } else if !line.trim().is_empty() {
                    state = "modified".into();
                    break;
                }
            }
            return state;
        }
    }

    "clean".to_string()
}

fn starred_file_path() -> Result<PathBuf, String> {
    let mut path = dirs::data_dir().ok_or("Could not find data directory")?;
    path.push("project-manager");
    fs::create_dir_all(&path).map_err(|e| format!("Failed to create data dir: {}", e))?;
    path.push("starred.json");
    Ok(path)
}

fn load_starred_projects() -> Result<HashSet<String>, String> {
    let file = starred_file_path()?;
    if let Ok(data) = fs::read_to_string(&file) {
        let list: HashSet<String> = serde_json::from_str(&data).unwrap_or_default();
        Ok(list)
    } else {
        Ok(HashSet::new())
    }
}

fn save_starred_projects(set: &HashSet<String>) -> Result<(), String> {
    let file = starred_file_path()?;
    let data =
        serde_json::to_string_pretty(set).map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(file, data).map_err(|e| format!("Failed to write starred file: {}", e))
}

#[tauri::command]
pub fn toggle_project_star(project_path: String) -> Result<(), String> {
    let mut starred = load_starred_projects()?;
    if !starred.insert(project_path.clone()) {
        starred.remove(&project_path);
    }
    save_starred_projects(&starred)?;
    Ok(())
}

#[tauri::command]
pub fn open_project_in_browser(project_path: String) -> Result<(), String> {
    let path = Path::new(&project_path);
    let target = if path.join("index.html").exists() {
        path.join("index.html")
    } else {
        path.to_path_buf()
    };

    open::that(target).map_err(|e| format!("Failed to open browser: {}", e))
}

#[tauri::command]
pub fn create_project(
    base_dir: String,
    category: String,
    name: String,
    project_type: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let base_path = Path::new(&base_dir);
    let category_path = base_path.join(&category);
    let project_path = category_path.join(&name);

    if project_path.exists() {
        return Err(format!(
            "Project '{}' already exists in category '{}'",
            name, category
        ));
    }

    fs::create_dir_all(&project_path)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;

    match project_type.as_str() {
        "rust" => {
            fs::write(project_path.join("Cargo.toml"), generate_cargo_toml(&name))
                .map_err(|e| format!("Failed to create Cargo.toml: {}", e))?;
            fs::create_dir_all(project_path.join("src"))
                .map_err(|e| format!("Failed to create src directory: {}", e))?;
            fs::write(
                project_path.join("src/main.rs"),
                "fn main() {\n    println!(\"Hello, world!\");\n}",
            )
            .map_err(|e| format!("Failed to create main.rs: {}", e))?;
        }
        "node" | "react" | "next" => {
            fs::write(
                project_path.join("package.json"),
                generate_package_json(&name, &project_type),
            )
            .map_err(|e| format!("Failed to create package.json: {}", e))?;
        }
        _ => {
            fs::write(
                project_path.join("README.md"),
                format!("# {}\n\nA new {} project.", name, project_type),
            )
            .map_err(|e| format!("Failed to create README.md: {}", e))?;
        }
    }

    // Emit timeline event for project creation
    use crate::backend::timeline::{TimelineEvent, TimelineEventType};
    use uuid::Uuid;
    use chrono::Utc;
    use std::collections::HashMap;

    // Get or create project UUID
    let project_id = match get_or_create_project_uuid(project_path.to_string_lossy().to_string()) {
        Ok(id) => Uuid::parse_str(&id).unwrap_or_else(|_| Uuid::new_v4()),
        Err(_) => Uuid::new_v4(),
    };

    let event = TimelineEvent {
        id: Uuid::new_v4(),
        project_id,
        timestamp: Utc::now(),
        event_type: TimelineEventType::ProjectCreated,
        title: format!("Project created: {}", name),
        description: Some(format!("Project '{}' was created in category '{}' as a {} project.", name, category, project_type)),
        metadata: HashMap::new(),
        user_id: None,
        tags: vec!["created".to_string(), project_type.clone()],
    };

    // Try to emit and store the event
    let _ = app_handle.emit("timeline_event_added", &event);
    if let Some(timeline_service) = app_handle.try_state::<TimelineService>() {
        let _ = timeline_service.add_event(&event);
    }

    Ok(project_path.to_string_lossy().to_string())
}

fn generate_cargo_toml(name: &str) -> String {
    format!(
        r#"[package]
name = "{}"
version = "0.1.0"
edition = "2021"

[dependencies]
"#,
        name
    )
}

fn generate_package_json(name: &str, project_type: &str) -> String {
    let dependencies = match project_type {
        "react" => {
            r#"    "react": "^18.2.0",
    "react-dom": "^18.2.0""#
        }
        "next" => {
            r#"    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0""#
        }
        _ => r#"    "express": "^4.18.0""#,
    };

    format!(
        r#"{{
  "name": "{}",
  "version": "1.0.0",
  "description": "",
  "dependencies": {{
{}
  }}
}}"#,
        name, dependencies
    )
}

#[tauri::command]
pub fn open_project_in_editor(project_path: String, editor: String) -> Result<(), String> {
    use std::process::Command;

    let result = match editor.as_str() {
        "vscode" => Command::new("code").arg(&project_path).spawn(),
        "subl" => Command::new("subl").arg(&project_path).spawn(),
        "vim" => Command::new("vim").arg(&project_path).spawn(),
        _ => return Err(format!("Unsupported editor: {}", editor)),
    };

    result.map_err(|e| format!("Failed to open project in {}: {}", editor, e))?;
    Ok(())
}

#[tauri::command]
pub fn open_project_in_terminal(project_path: String) -> Result<(), String> {
    use std::process::Command;

    #[cfg(target_os = "windows")]
    let result = Command::new("cmd")
        .args(&[
            "/C",
            "start",
            "cmd",
            "/K",
            &format!("cd /D \"{}\"", project_path),
        ])
        .spawn();

    #[cfg(target_os = "macos")]
    let result = Command::new("open")
        .args(&["-a", "Terminal", &project_path])
        .spawn();

    #[cfg(target_os = "linux")]
    let result = Command::new("gnome-terminal")
        .args(&["--working-directory", &project_path])
        .spawn();

    result.map_err(|e| format!("Failed to open terminal: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn open_project_in_file_manager(project_path: String) -> Result<(), String> {
    use std::process::Command;

    #[cfg(target_os = "windows")]
    let result = Command::new("explorer").arg(&project_path).spawn();

    #[cfg(target_os = "macos")]
    let result = Command::new("open").arg(&project_path).spawn();

    #[cfg(target_os = "linux")]
    let result = Command::new("xdg-open").arg(&project_path).spawn();

    result.map_err(|e| format!("Failed to open file manager: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn get_project_structure(project_path: String) -> Result<serde_json::Value, String> {
    use serde_json::json;

    fn build_tree(
        path: &Path,
        max_depth: usize,
        current_depth: usize,
    ) -> Result<serde_json::Value, String> {
        if current_depth >= max_depth {
            return Ok(json!({}));
        }

        let mut tree = serde_json::Map::new();
        let mut entries: Vec<_> = fs::read_dir(path)
            .map_err(|e| format!("Failed to read directory: {}", e))?
            .filter_map(|e| e.ok())
            .collect();

        entries.sort_by(|a, b| {
            let a_path = a.path();
            let b_path = b.path();
            let a_is_dir = a_path.is_dir();
            let b_is_dir = b_path.is_dir();
            if a_is_dir && !b_is_dir {
                std::cmp::Ordering::Less
            } else if !a_is_dir && b_is_dir {
                std::cmp::Ordering::Greater
            } else {
                a.file_name()
                    .to_string_lossy()
                    .to_lowercase()
                    .cmp(&b.file_name().to_string_lossy().to_lowercase())
            }
        });

        for entry in entries {
            let path = entry.path();
            let name = path.file_name().unwrap().to_string_lossy().to_string();

            if name.starts_with('.') || name == "node_modules" || name == "target" {
                continue;
            }

            if path.is_dir() {
                tree.insert(name, build_tree(&path, max_depth, current_depth + 1)?);
            } else {
                tree.insert(name, json!("file"));
            }
        }

        Ok(json!(tree))
    }

    let path = Path::new(&project_path);
    build_tree(path, 3, 0)
}

#[tauri::command]
pub fn read_workspace_file(app_handle: AppHandle, relative_path: String) -> Result<String, String> {
    file_ops::read_file(&app_handle, &relative_path)
}

#[tauri::command]
pub fn write_workspace_file(
    app_handle: AppHandle,
    relative_path: String,
    contents: String,
) -> Result<(), String> {
    file_ops::write_file(&app_handle, &relative_path, &contents)
}
