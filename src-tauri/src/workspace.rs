use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::{api::dialog::blocking::FileDialogBuilder, AppHandle};

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceConfig {
    pub base_dir: PathBuf,
}

impl WorkspaceConfig {
    fn config_path(app: &AppHandle) -> Option<PathBuf> {
        app.path()
            .app_config_dir()
            .ok()
            .map(|dir| dir.join("workspace.json"))
    }

    pub fn load(app: &AppHandle) -> Option<Self> {
        let path = Self::config_path(app)?;
        let data = fs::read_to_string(path).ok()?;
        serde_json::from_str(&data).ok()
    }

    pub fn save(&self, app: &AppHandle) -> std::io::Result<()> {
        if let Some(path) = Self::config_path(app) {
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::write(path, serde_json::to_string_pretty(self).unwrap())?;
        }
        Ok(())
    }
}

fn create_category_dirs(base_dir: &Path) -> std::io::Result<()> {
    let categories = ["desktop-apps", "web-apps", "cli-apps", "other"];
    fs::create_dir_all(base_dir)?;
    for cat in categories.iter() {
        fs::create_dir_all(base_dir.join(cat))?;
    }
    Ok(())
}

pub fn ensure_workspace(app: &AppHandle) -> Result<PathBuf, String> {
    if let Some(cfg) = WorkspaceConfig::load(app) {
        create_category_dirs(&cfg.base_dir).map_err(|e| e.to_string())?;
        return Ok(cfg.base_dir);
    }

    let selected = FileDialogBuilder::new()
        .set_title("Select a workspace directory")
        .pick_folder();

    let base_dir = selected.unwrap_or_else(|| {
        dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("dev")
    });

    create_category_dirs(&base_dir).map_err(|e| e.to_string())?;
    let cfg = WorkspaceConfig {
        base_dir: base_dir.clone(),
    };
    cfg.save(app).map_err(|e| e.to_string())?;
    Ok(base_dir)
}
