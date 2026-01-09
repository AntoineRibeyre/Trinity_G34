use tauri::{
    menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem},
    tray::TrayIcon,
    AppHandle, Manager, Wry,
};

/// Crée le menu du tray icon
pub fn create_tray_menu(app: &tauri::App) -> Result<Menu<Wry>, tauri::Error> {
    let toggle_item = MenuItem::with_id(app, "toggle", "⏯️ Play/Pause Pointage", true, None::<&str>)?;
    let separator1 = PredefinedMenuItem::separator(app)?;
    let config_item = MenuItem::with_id(app, "config", "⚙️ Configuration", true, None::<&str>)?;
    let separator2 = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", "❌ Quitter", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &toggle_item,
            &separator1,
            &config_item,
            &separator2,
            &quit_item,
        ],
    )?;

    Ok(menu)
}

/// Gère les événements du menu tray
pub fn handle_menu_event(app: &AppHandle, event: &MenuEvent) {
    match event.id().as_ref() {
        "toggle" => {
            log::info!("Toggle pointage demandé depuis le tray");
            // Le toggle sera géré via la commande Tauri
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.emit("toggle-pointing", ());
            }
        }
        "config" => {
            log::info!("Ouverture de la configuration");
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        "quit" => {
            log::info!("Fermeture de l'application");
            app.exit(0);
        }
        _ => {}
    }
}

/// Met à jour l'icône du tray en fonction de l'état
pub fn update_tray_icon(tray: &TrayIcon, is_pointing: bool, is_active: bool) {
    let tooltip = if is_pointing {
        if is_active {
            "Trinity - Pointage actif ✓"
        } else {
            "Trinity - En pause (inactif)"
        }
    } else {
        "Trinity - Pointage arrêté"
    };

    let _ = tray.set_tooltip(Some(tooltip));
}
