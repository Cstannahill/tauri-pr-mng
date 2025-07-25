// src-tauri/src/main.rs
use std::sync::Mutex;
use tauri::Manager;

mod app_state;
mod backend;
mod file_ops;
mod workspace;

use app_state::AppState;
use backend::*;

fn main() {
    use backend::{timeline_service::TimelineService, kanban_service::KanbanService};
    use std::path::PathBuf;
    tauri::Builder::default()
        .manage(Mutex::new(AppState::default()))
        .manage({
            // Place the SQLite DB in the workspace data dir
            let db_path = dirs::data_dir()
                .unwrap_or_else(|| PathBuf::from("./"))
                .join("project-manager/timeline.sqlite");
            TimelineService::new(db_path.to_str().unwrap())
        })
        .manage({
            // Place the Kanban SQLite DB in the workspace data dir
            let kanban_db_path = dirs::data_dir()
                .unwrap_or_else(|| PathBuf::from("./"))
                .join("project-manager/kanban.sqlite");
            KanbanService::new(kanban_db_path.to_str().unwrap())
        })
        .setup(|app| {
            let handle = app.handle();
            let base = workspace::ensure_workspace(&handle)?;
            let base_str = base.to_string_lossy().into_owned();
            let app_state = app.state::<Mutex<AppState>>();
            {
                let mut state = app_state.lock().unwrap();
                state.base_dir = base_str;
            }
            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            initialize_workspace,
            scan_projects,
            create_project,
            open_project_in_editor,
            open_project_in_terminal,
            open_project_in_file_manager,
            open_project_in_browser,
            toggle_project_star,
            get_project_structure,
            read_workspace_file,
            write_workspace_file,
            create_category,
            add_timeline_event,
            get_project_timeline,
            get_or_create_project_uuid,
            trigger_git_commit_timeline,
            create_kanban_task,
            update_kanban_task,
            delete_kanban_task,
            get_kanban_board,
            move_kanban_task,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
