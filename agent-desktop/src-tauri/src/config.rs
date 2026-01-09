use auto_launch::AutoLaunchBuilder;
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Configuration de l'application
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// URL du serveur GraphQL
    pub server_url: String,
    /// ID de l'utilisateur
    pub user_id: Option<i32>,
    /// Seuil d'inactivité en secondes
    pub inactivity_threshold_secs: u64,
    /// Lancer au démarrage du système
    pub auto_launch: bool,
    /// Token d'authentification (optionnel)
    pub auth_token: Option<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            server_url: "http://localhost:8000/graphql".to_string(),
            user_id: None,
            inactivity_threshold_secs: 60,
            auto_launch: false,
            auth_token: None,
        }
    }
}

/// Gestionnaire de configuration
pub struct ConfigManager {
    config_path: PathBuf,
}

impl ConfigManager {
    pub fn new() -> Self {
        let config_path = Self::get_config_path();
        Self { config_path }
    }

    /// Obtient le chemin du fichier de configuration
    fn get_config_path() -> PathBuf {
        if let Some(proj_dirs) = ProjectDirs::from("com", "trinity", "activity-agent") {
            let config_dir = proj_dirs.config_dir();
            fs::create_dir_all(config_dir).ok();
            config_dir.join("config.json")
        } else {
            // Fallback vers le répertoire courant
            PathBuf::from("config.json")
        }
    }

    /// Charge la configuration depuis le fichier
    pub fn load(&self) -> Result<AppConfig, ConfigError> {
        if !self.config_path.exists() {
            return Ok(AppConfig::default());
        }

        let content = fs::read_to_string(&self.config_path)
            .map_err(|e| ConfigError::ReadError(e.to_string()))?;

        serde_json::from_str(&content).map_err(|e| ConfigError::ParseError(e.to_string()))
    }

    /// Sauvegarde la configuration dans le fichier
    pub fn save(&self, config: &AppConfig) -> Result<(), ConfigError> {
        // S'assurer que le répertoire existe
        if let Some(parent) = self.config_path.parent() {
            fs::create_dir_all(parent).map_err(|e| ConfigError::WriteError(e.to_string()))?;
        }

        let content =
            serde_json::to_string_pretty(config).map_err(|e| ConfigError::SerializeError(e.to_string()))?;

        fs::write(&self.config_path, content).map_err(|e| ConfigError::WriteError(e.to_string()))?;

        log::info!("Configuration sauvegardée dans {:?}", self.config_path);
        Ok(())
    }
}

/// Erreurs de configuration
#[derive(Debug)]
pub enum ConfigError {
    ReadError(String),
    WriteError(String),
    ParseError(String),
    SerializeError(String),
}

impl std::fmt::Display for ConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConfigError::ReadError(e) => write!(f, "Erreur lecture: {}", e),
            ConfigError::WriteError(e) => write!(f, "Erreur écriture: {}", e),
            ConfigError::ParseError(e) => write!(f, "Erreur parsing: {}", e),
            ConfigError::SerializeError(e) => write!(f, "Erreur sérialisation: {}", e),
        }
    }
}

impl std::error::Error for ConfigError {}

/// Configure le lancement automatique au démarrage
pub fn set_auto_launch(enable: bool) -> Result<(), String> {
    let app_name = "Trinity Activity Agent";
    
    // Obtenir le chemin de l'exécutable actuel
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("Impossible d'obtenir le chemin de l'exécutable: {}", e))?;

    let auto_launch = AutoLaunchBuilder::new()
        .set_app_name(app_name)
        .set_app_path(&exe_path.to_string_lossy())
        .set_use_launch_agent(true) // Pour macOS
        .build()
        .map_err(|e| format!("Erreur création AutoLaunch: {}", e))?;

    if enable {
        auto_launch
            .enable()
            .map_err(|e| format!("Erreur activation auto-launch: {}", e))?;
        log::info!("Lancement automatique activé");
    } else {
        auto_launch
            .disable()
            .map_err(|e| format!("Erreur désactivation auto-launch: {}", e))?;
        log::info!("Lancement automatique désactivé");
    }

    Ok(())
}
