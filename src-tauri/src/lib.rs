fn create_main_window(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let mut builder =
        tauri::WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::App(Default::default()))
            .title("gooey")
            .maximized(true);

    #[cfg(target_os = "macos")]
    {
        builder = builder
            .decorations(true)
            .title_bar_style(tauri::TitleBarStyle::Overlay)
            .hidden_title(true)
            .traffic_light_position(tauri::Position::Physical(tauri::PhysicalPosition {
                x: 23,
                y: 40,
            }));
    }

    #[cfg(not(target_os = "macos"))]
    {
        builder = builder.decorations(true);
    }

    builder.build()?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            create_main_window(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
