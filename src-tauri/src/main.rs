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
    tauri::Builder::default()
        .manage(Mutex::new(AppState::default()))
        .setup(|app| {
            let handle = app.handle();
            let base = workspace::ensure_workspace(&handle)?;
            let base_str = base.to_string_lossy().into_owned();   // avoid holding a PathBuf borrow

            // 1️⃣ keep the State<'_, Mutex<AppState>> alive
            let app_state = app.state::<Mutex<AppState>>();       
            
            // 2️⃣ lock and mutate safely
            {
                let mut state = app_state.lock().unwrap();
                state.base_dir = base_str;
            } // 3️⃣ guard drops here, mutex is unlocked
            Ok(())
        })
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
            write_workspace_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
