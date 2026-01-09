use crate::config::ConfigManager;
use crate::graphql_client::GraphQLClient;
use rdev::{listen, Event, EventType};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

/// Moniteur d'activité système
pub struct ActivityMonitor {
    /// Dernière activité détectée
    last_activity: Instant,
    /// Seuil d'inactivité en secondes
    inactivity_threshold_secs: u64,
    /// L'utilisateur est-il actuellement actif ?
    is_active: bool,
    /// Temps de travail total (en secondes)
    work_time_secs: u64,
    /// Instant de début du pointage actuel
    work_start: Option<Instant>,
}

impl ActivityMonitor {
    pub fn new(inactivity_threshold_secs: u64) -> Self {
        Self {
            last_activity: Instant::now(),
            inactivity_threshold_secs,
            is_active: true,
            work_time_secs: 0,
            work_start: None,
        }
    }

    /// Enregistre une activité
    pub fn record_activity(&mut self) {
        self.last_activity = Instant::now();
        if !self.is_active {
            self.is_active = true;
            log::info!("Utilisateur redevenu actif");
        }
    }

    /// Met à jour l'état d'activité
    pub fn update(&mut self) -> bool {
        let inactive_duration = self.last_activity.elapsed();
        let was_active = self.is_active;

        if inactive_duration.as_secs() >= self.inactivity_threshold_secs {
            if self.is_active {
                self.is_active = false;
                log::info!(
                    "Utilisateur inactif après {} secondes",
                    inactive_duration.as_secs()
                );
            }
        }

        // Retourne true si l'état a changé
        was_active != self.is_active
    }

    /// Vérifie si l'utilisateur est actif
    pub fn is_active(&self) -> bool {
        self.is_active
    }

    /// Retourne le nombre de secondes d'inactivité
    pub fn get_inactive_seconds(&self) -> u64 {
        self.last_activity.elapsed().as_secs()
    }

    /// Définit le seuil d'inactivité
    pub fn set_inactivity_threshold(&mut self, secs: u64) {
        self.inactivity_threshold_secs = secs;
        log::info!("Seuil d'inactivité mis à jour: {} secondes", secs);
    }

    /// Démarre le compteur de temps de travail
    pub fn start_work(&mut self) {
        if self.work_start.is_none() {
            self.work_start = Some(Instant::now());
            log::info!("Compteur de temps de travail démarré");
        }
    }

    /// Arrête le compteur de temps de travail
    pub fn stop_work(&mut self) {
        if let Some(start) = self.work_start.take() {
            self.work_time_secs += start.elapsed().as_secs();
            log::info!("Compteur de temps de travail arrêté");
        }
    }

    /// Retourne le temps de travail formaté (HH:MM)
    pub fn get_work_time_formatted(&self) -> String {
        let mut total_secs = self.work_time_secs;
        
        // Ajouter le temps en cours si le compteur est actif
        if let Some(start) = self.work_start {
            total_secs += start.elapsed().as_secs();
        }

        let hours = total_secs / 3600;
        let minutes = (total_secs % 3600) / 60;
        format!("{:02}:{:02}", hours, minutes)
    }

    /// Réinitialise le temps de travail (pour un nouveau jour)
    pub fn reset_work_time(&mut self) {
        self.work_time_secs = 0;
        self.work_start = None;
    }
}

/// Démarre le monitoring d'activité dans un thread séparé
pub fn start_monitoring(
    activity_monitor: Arc<Mutex<ActivityMonitor>>,
    graphql_client: Arc<Mutex<GraphQLClient>>,
    is_pointing: Arc<Mutex<bool>>,
    config_manager: ConfigManager,
) {
    log::info!("Démarrage du monitoring d'activité système");

    // Thread pour écouter les événements système
    let activity_monitor_events = Arc::clone(&activity_monitor);
    std::thread::spawn(move || {
        log::info!("Écoute des événements clavier/souris...");
        
        if let Err(error) = listen(move |event: Event| {
            match event.event_type {
                EventType::KeyPress(_)
                | EventType::KeyRelease(_)
                | EventType::ButtonPress(_)
                | EventType::ButtonRelease(_)
                | EventType::MouseMove { .. }
                | EventType::Wheel { .. } => {
                    if let Ok(mut monitor) = activity_monitor_events.lock() {
                        monitor.record_activity();
                    }
                }
            }
        }) {
            log::error!("Erreur lors de l'écoute des événements: {:?}", error);
        }
    });

    // Thread principal pour vérifier l'état et gérer le pointage
    let rt = tokio::runtime::Runtime::new().expect("Erreur création runtime Tokio");
    
    loop {
        std::thread::sleep(Duration::from_secs(1));

        let state_changed;
        let is_active;
        let user_id;

        // Vérifier l'état d'activité
        {
            if let Ok(mut monitor) = activity_monitor.lock() {
                state_changed = monitor.update();
                is_active = monitor.is_active();
            } else {
                continue;
            }
        }

        // Charger la configuration pour obtenir l'user_id
        match config_manager.load() {
            Ok(config) => {
                user_id = config.user_id;
            }
            Err(_) => continue,
        }

        // Si l'état a changé, mettre à jour le pointage
        if state_changed {
            if let Some(uid) = user_id {
                let is_currently_pointing = *is_pointing.lock().unwrap_or_else(|e| e.into_inner());

                if is_active && !is_currently_pointing {
                    // L'utilisateur est redevenu actif -> démarrer le pointage
                    log::info!("Démarrage automatique du pointage pour l'utilisateur {}", uid);
                    
                    if let Ok(client) = graphql_client.lock() {
                        rt.block_on(async {
                            match client.register_arrival(uid).await {
                                Ok(_) => {
                                    *is_pointing.lock().unwrap() = true;
                                    if let Ok(mut monitor) = activity_monitor.lock() {
                                        monitor.start_work();
                                    }
                                    log::info!("Pointage démarré avec succès");
                                }
                                Err(e) => {
                                    log::error!("Erreur démarrage pointage: {}", e);
                                }
                            }
                        });
                    }
                } else if !is_active && is_currently_pointing {
                    // L'utilisateur est devenu inactif -> arrêter le pointage
                    log::info!("Arrêt automatique du pointage pour l'utilisateur {}", uid);
                    
                    if let Ok(client) = graphql_client.lock() {
                        rt.block_on(async {
                            match client.register_end(uid, "work").await {
                                Ok(_) => {
                                    *is_pointing.lock().unwrap() = false;
                                    if let Ok(mut monitor) = activity_monitor.lock() {
                                        monitor.stop_work();
                                    }
                                    log::info!("Pointage arrêté avec succès");
                                }
                                Err(e) => {
                                    log::error!("Erreur arrêt pointage: {}", e);
                                }
                            }
                        });
                    }
                }
            }
        }
    }
}
