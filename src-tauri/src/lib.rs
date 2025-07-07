// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod backend;
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            backend::initialize_workspace,
            backend::scan_projects,
            backend::create_project,
            backend::open_project_in_editor,
            backend::open_project_in_terminal,
            backend::open_project_in_file_manager,
            backend::open_project_in_browser,
            backend::toggle_project_star,
            backend::get_project_structure,
            backend::read_workspace_file,
            backend::write_workspace_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
