// src-tauri/src/main.rs
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
struct Project {
    name: String,
    path: String,
    project_type: String,
    last_modified: String,
    size: u64,
    files_count: usize,
    git_status: String,
    starred: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct ProjectCategory {
    name: String,
    path: String,
    projects: Vec<Project>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AppState {
    base_dir: String,
    categories: Vec<String>,
}

impl Default for AppState {
    fn default() -> Self {
        AppState {
            base_dir: "~/dev".to_string(),
            categories: vec![
                "desktop-apps".to_string(),
                "web-apps".to_string(),
                "cli-apps".to_string(),
                "other".to_string(),
            ],
        }
    }
}

#[tauri::command]
fn initialize_workspace(app_handle: tauri::AppHandle) -> Result<String, String> {
    let home_dir = dirs::home_dir().ok_or("Could not find home directory")?;
    let base_path = home_dir.join("dev");
    
    // Create base directory if it doesn't exist
    if !base_path.exists() {
        fs::create_dir_all(&base_path).map_err(|e| format!("Failed to create base directory: {}", e))?;
    }
    
    // Create category directories
    let categories = ["desktop-apps", "web-apps", "cli-apps", "other"];
    for category in categories.iter() {
        let category_path = base_path.join(category);
        if !category_path.exists() {
            fs::create_dir_all(&category_path).map_err(|e| format!("Failed to create category directory {}: {}", category, e))?;
        }
    }
    
    Ok(base_path.to_string_lossy().to_string())
}

#[tauri::command]
fn scan_projects(base_dir: String) -> Result<HashMap<String, Vec<Project>>, String> {
    let mut projects_map = HashMap::new();
    let base_path = Path::new(&base_dir);

    let categories = ["desktop-apps", "web-apps", "cli-apps", "other"];
    let starred = load_starred_projects().unwrap_or_default();
    
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
    let name = path.file_name()
        .ok_or("Invalid project directory name")?
        .to_string_lossy()
        .to_string();
    
    let metadata = fs::metadata(path)
        .map_err(|e| format!("Failed to get metadata for {}: {}", name, e))?;
    
    let last_modified = metadata.modified()
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
    // Check for specific project files to determine type
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
                    // Skip node_modules, target, and other large directories
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
    use std::time::UNIX_EPOCH;
    use chrono::{DateTime, Utc};
    
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
        .args(["-C", path.to_str().unwrap_or(""), "status", "--porcelain", "--branch"])
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
    let data = serde_json::to_string_pretty(set).map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(file, data).map_err(|e| format!("Failed to write starred file: {}", e))
}

#[tauri::command]
fn toggle_project_star(project_path: String) -> Result<(), String> {
    let mut starred = load_starred_projects()?;
    if !starred.insert(project_path.clone()) {
        starred.remove(&project_path);
    }
    save_starred_projects(&starred)?;
    Ok(())
}

#[tauri::command]
fn open_project_in_browser(project_path: String) -> Result<(), String> {
    let path = Path::new(&project_path);
    let target = if path.join("index.html").exists() {
        path.join("index.html")
    } else {
        path.to_path_buf()
    };

    open::that(target).map_err(|e| format!("Failed to open browser: {}", e))
}

#[tauri::command]
fn create_project(base_dir: String, category: String, name: String, project_type: String) -> Result<String, String> {
    let base_path = Path::new(&base_dir);
    let category_path = base_path.join(&category);
    let project_path = category_path.join(&name);
    
    if project_path.exists() {
        return Err(format!("Project '{}' already exists in category '{}'", name, category));
    }
    
    fs::create_dir_all(&project_path)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;
    
    // Create basic project structure based on type
    match project_type.as_str() {
        "rust" => {
            fs::write(project_path.join("Cargo.toml"), generate_cargo_toml(&name))
                .map_err(|e| format!("Failed to create Cargo.toml: {}", e))?;
            fs::create_dir_all(project_path.join("src"))
                .map_err(|e| format!("Failed to create src directory: {}", e))?;
            fs::write(project_path.join("src/main.rs"), "fn main() {\n    println!(\"Hello, world!\");\n}")
                .map_err(|e| format!("Failed to create main.rs: {}", e))?;
        },
        "node" | "react" | "next" => {
            fs::write(project_path.join("package.json"), generate_package_json(&name, &project_type))
                .map_err(|e| format!("Failed to create package.json: {}", e))?;
        },
        _ => {
            fs::write(project_path.join("README.md"), format!("# {}\n\nA new {} project.", name, project_type))
                .map_err(|e| format!("Failed to create README.md: {}", e))?;
        }
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
        "react" => r#"    "react": "^18.2.0",
    "react-dom": "^18.2.0""#,
        "next" => r#"    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0""#,
        _ => r#"    "express": "^4.18.0""#,
    };
    
    format!(
        r#"{{
  "name": "{}",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {{
    "start": "node index.js"
  }},
  "dependencies": {{
{}
  }}
}}"#,
        name, dependencies
    )
}

#[tauri::command]
fn open_project_in_editor(project_path: String, editor: String) -> Result<(), String> {
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
fn open_project_in_terminal(project_path: String) -> Result<(), String> {
    use std::process::Command;
    
    #[cfg(target_os = "windows")]
    let result = Command::new("cmd")
        .args(&["/C", "start", "cmd", "/K", &format!("cd /D \"{}\"", project_path)])
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
fn open_project_in_file_manager(project_path: String) -> Result<(), String> {
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
fn get_project_structure(project_path: String) -> Result<serde_json::Value, String> {
    use serde_json::json;
    
    fn build_tree(path: &Path, max_depth: usize, current_depth: usize) -> Result<serde_json::Value, String> {
        if current_depth >= max_depth {
            return Ok(json!({}));
        }
        
        let mut tree = serde_json::Map::new();
        let entries = fs::read_dir(path)
            .map_err(|e| format!("Failed to read directory: {}", e))?;
        
        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let path = entry.path();
            let name = path.file_name().unwrap().to_string_lossy().to_string();
            
            // Skip hidden files and common build directories
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
    build_tree(path, 3, 0) // Limit depth to 3 levels
}

fn main() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            initialize_workspace,
            scan_projects,
            create_project,
            open_project_in_editor,
            open_project_in_terminal,
            open_project_in_file_manager,
            open_project_in_browser,
            toggle_project_star,
            get_project_structure
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

