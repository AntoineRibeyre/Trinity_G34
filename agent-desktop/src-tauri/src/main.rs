#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod activity_monitor;
mod config;
mod graphql_client;
mod tray;

use activity_monitor::ActivityMonitor;
use config::{AppConfig, ConfigManager};
use graphql_client::GraphQLClient;
use std::sync::{Arc, Mutex};
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};

/// État global de l'application
pub struct AppState {
    pub config_manager: ConfigManager,
    pub activity_monitor: Arc<Mutex<ActivityMonitor>>,
    pub graphql_client: Arc<Mutex<GraphQLClient>>,
    pub is_pointing: Arc<Mutex<bool>>,
}

/// Commande pour récupérer la configuration
#[tauri::command]
fn get_config(state: tauri::State<AppState>) -> Result<AppConfig, String> {
    state
        .config_manager
        .load()
        .map_err(|e| format!("Erreur chargement config: {}", e))
}

/// Commande pour sauvegarder la configuration
#[tauri::command]
fn save_config(config: AppConfig, state: tauri::State<AppState>) -> Result<(), String> {
    state
        .config_manager
        .save(&config)
        .map_err(|e| format!("Erreur sauvegarde config: {}", e))?;

    // Mettre à jour le client GraphQL avec la nouvelle URL
    if let Ok(mut client) = state.graphql_client.lock() {
        client.set_server_url(&config.server_url);
        if let Some(user_id) = config.user_id {
            client.set_user_id(user_id);
        }
    }

    // Mettre à jour le seuil d'inactivité
    if let Ok(mut monitor) = state.activity_monitor.lock() {
        monitor.set_inactivity_threshold(config.inactivity_threshold_secs);
    }

    // Configurer le lancement automatique
    if let Err(e) = config::set_auto_launch(config.auto_launch) {
        log::warn!("Impossible de configurer le lancement automatique: {}", e);
    }

    Ok(())
}

/// Commande pour obtenir le statut d'activité
#[tauri::command]
fn get_activity_status(state: tauri::State<AppState>) -> Result<serde_json::Value, String> {
    let is_active;
    let inactive_seconds;
    let work_time;

    {
        let monitor = state
            .activity_monitor
            .lock()
            .map_err(|e| e.to_string())?;
        is_active = monitor.is_active();
        inactive_seconds = monitor.get_inactive_seconds();
        work_time = monitor.get_work_time_formatted();
    }

    let is_pointing = *state.is_pointing.lock().map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "is_active": is_active,
        "is_connected": is_pointing,
        "inactive_seconds": inactive_seconds,
        "work_time": work_time
    }))
}

/// Commande pour basculer manuellement le pointage
#[tauri::command]
async fn toggle_pointing(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let config = state
        .config_manager
        .load()
        .map_err(|e| format!("Erreur config: {}", e))?;

    let user_id = config.user_id.ok_or("User ID non configuré")?;

    let is_currently_pointing = *state.is_pointing.lock().map_err(|e| e.to_string())?;

    let client = state.graphql_client.lock().map_err(|e| e.to_string())?;

    if is_currently_pointing {
        // Arrêter le pointage
        client
            .register_end(user_id, "work")
            .await
            .map_err(|e| format!("Erreur arrêt pointage: {}", e))?;
        *state.is_pointing.lock().map_err(|e| e.to_string())? = false;
        log::info!("Pointage arrêté manuellement");
        Ok(false)
    } else {
        // Démarrer le pointage
        client
            .register_arrival(user_id)
            .await
            .map_err(|e| format!("Erreur démarrage pointage: {}", e))?;
        *state.is_pointing.lock().map_err(|e| e.to_string())? = true;
        log::info!("Pointage démarré manuellement");
        Ok(true)
    }
}

fn main() {
    // Initialiser le logger
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    log::info!("Démarrage de Trinity Activity Agent");

    // Initialiser les composants
    let config_manager = ConfigManager::new();
    let config = config_manager.load().unwrap_or_default();

    let graphql_client = GraphQLClient::new(&config.server_url);
    let activity_monitor = ActivityMonitor::new(config.inactivity_threshold_secs);

    let app_state = AppState {
        config_manager,
        activity_monitor: Arc::new(Mutex::new(activity_monitor)),
        graphql_client: Arc::new(Mutex::new(graphql_client)),
        is_pointing: Arc::new(Mutex::new(false)),
    };

    // Cloner les références pour le thread de monitoring
    let activity_monitor_clone = Arc::clone(&app_state.activity_monitor);
    let graphql_client_clone = Arc::clone(&app_state.graphql_client);
    let is_pointing_clone = Arc::clone(&app_state.is_pointing);
    let config_manager_clone = ConfigManager::new();

    // Démarrer le monitoring d'activité dans un thread séparé
    std::thread::spawn(move || {
        activity_monitor::start_monitoring(
            activity_monitor_clone,
            graphql_client_clone,
            is_pointing_clone,
            config_manager_clone,
        );
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(app_state)
        .setup(|app| {
            // Créer le menu du tray
            let tray_menu = tray::create_tray_menu(app)?;

            // Créer l'icône du tray
            let _tray = TrayIconBuilder::with_id("main-tray")
                .menu(&tray_menu)
                .menu_on_left_click(false)
                .on_menu_event(move |app, event| {
                    tray::handle_menu_event(app, &event);
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            log::info!("Tray icon créé avec succès");
            Ok(())
        })
        .on_window_event(|window, event| {
            // Masquer la fenêtre au lieu de la fermer
            if let WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_config,
            save_config,
            get_activity_status,
            toggle_pointing
        ])
        .run(tauri::generate_context!())
        .expect("Erreur lors du lancement de l'application");
}
