use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AppState {
    pub base_dir: String,
    pub categories: Vec<String>,
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
