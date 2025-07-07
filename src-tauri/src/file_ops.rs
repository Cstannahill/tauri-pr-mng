use std::sync::Mutex;
use std::{
    fs,
    path::{Path, PathBuf},
};

use tauri::AppHandle;

use crate::app_state::AppState;

fn workspace_path(app: &AppHandle, relative: &str) -> Result<PathBuf, String> {
    let state = app.state::<Mutex<AppState>>();
    let base_dir = state
        .lock()
        .map_err(|_| "State lock poisoned".to_string())?
        .base_dir
        .clone();
    let base = PathBuf::from(base_dir);
    let target = base.join(relative);

    let canonical_base =
        fs::canonicalize(&base).map_err(|e| format!("Failed to resolve base dir: {}", e))?;
    let canonical_target = fs::canonicalize(&target).unwrap_or(target.clone());
    if !canonical_target.starts_with(&canonical_base) {
        return Err("Invalid path".into());
    }
    Ok(target)
}

pub fn read_file(app: &AppHandle, relative: &str) -> Result<String, String> {
    let path = workspace_path(app, relative)?;
    fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))
}

pub fn write_file(app: &AppHandle, relative: &str, contents: &str) -> Result<(), String> {
    let path = workspace_path(app, relative)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create dirs: {}", e))?;
    }
    fs::write(path, contents).map_err(|e| format!("Failed to write file: {}", e))
}
