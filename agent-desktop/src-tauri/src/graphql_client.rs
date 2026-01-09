use reqwest::Client;
use serde::{Deserialize, Serialize};

/// Client GraphQL pour communiquer avec le backend Trinity
pub struct GraphQLClient {
    client: Client,
    server_url: String,
    user_id: Option<i32>,
}

/// Requête GraphQL générique
#[derive(Serialize)]
struct GraphQLRequest {
    query: String,
    variables: serde_json::Value,
}

/// Réponse GraphQL générique
#[derive(Deserialize, Debug)]
struct GraphQLResponse<T> {
    data: Option<T>,
    errors: Option<Vec<GraphQLError>>,
}

/// Erreur GraphQL
#[derive(Deserialize, Debug)]
struct GraphQLError {
    message: String,
}

/// Réponse pour registerArrival
#[derive(Deserialize, Debug)]
struct RegisterArrivalData {
    #[serde(rename = "registerArrival")]
    register_arrival: Option<PointageResult>,
}

/// Réponse pour registerEnd
#[derive(Deserialize, Debug)]
struct RegisterEndData {
    #[serde(rename = "registerEnd")]
    register_end: Option<PointageResult>,
}

/// Résultat d'un pointage
#[derive(Deserialize, Debug)]
struct PointageResult {
    #[serde(rename = "datetimeField")]
    datetime_field: Option<String>,
    #[serde(rename = "durationField")]
    duration_field: Option<String>,
}

impl GraphQLClient {
    pub fn new(server_url: &str) -> Self {
        Self {
            client: Client::new(),
            server_url: server_url.to_string(),
            user_id: None,
        }
    }

    /// Met à jour l'URL du serveur
    pub fn set_server_url(&mut self, url: &str) {
        self.server_url = url.to_string();
        log::info!("URL du serveur mise à jour: {}", url);
    }

    /// Met à jour l'ID utilisateur
    pub fn set_user_id(&mut self, user_id: i32) {
        self.user_id = Some(user_id);
        log::info!("User ID mis à jour: {}", user_id);
    }

    /// Enregistre une arrivée (début de pointage)
    pub async fn register_arrival(&self, user_id: i32) -> Result<(), GraphQLClientError> {
        let query = r#"
            mutation RegisterArrival($userId: Int!) {
                registerArrival(userId: $userId) {
                    datetimeField
                    durationField
                }
            }
        "#;

        let request = GraphQLRequest {
            query: query.to_string(),
            variables: serde_json::json!({
                "userId": user_id
            }),
        };

        log::debug!("Envoi mutation registerArrival pour user {}", user_id);

        let response = self
            .client
            .post(&self.server_url)
            .json(&request)
            .send()
            .await
            .map_err(|e| GraphQLClientError::NetworkError(e.to_string()))?;

        let response_body: GraphQLResponse<RegisterArrivalData> = response
            .json()
            .await
            .map_err(|e| GraphQLClientError::ParseError(e.to_string()))?;

        if let Some(errors) = response_body.errors {
            if !errors.is_empty() {
                return Err(GraphQLClientError::GraphQLError(
                    errors.iter().map(|e| e.message.clone()).collect::<Vec<_>>().join(", "),
                ));
            }
        }

        log::info!("registerArrival réussi pour user {}", user_id);
        Ok(())
    }

    /// Enregistre une fin de pointage
    pub async fn register_end(&self, user_id: i32, day_type: &str) -> Result<(), GraphQLClientError> {
        let query = r#"
            mutation RegisterEnd($userId: Int!, $dayType: String!) {
                registerEnd(userId: $userId, dayType: $dayType) {
                    datetimeField
                    durationField
                }
            }
        "#;

        let request = GraphQLRequest {
            query: query.to_string(),
            variables: serde_json::json!({
                "userId": user_id,
                "dayType": day_type
            }),
        };

        log::debug!("Envoi mutation registerEnd pour user {}", user_id);

        let response = self
            .client
            .post(&self.server_url)
            .json(&request)
            .send()
            .await
            .map_err(|e| GraphQLClientError::NetworkError(e.to_string()))?;

        let response_body: GraphQLResponse<RegisterEndData> = response
            .json()
            .await
            .map_err(|e| GraphQLClientError::ParseError(e.to_string()))?;

        if let Some(errors) = response_body.errors {
            if !errors.is_empty() {
                return Err(GraphQLClientError::GraphQLError(
                    errors.iter().map(|e| e.message.clone()).collect::<Vec<_>>().join(", "),
                ));
            }
        }

        log::info!("registerEnd réussi pour user {}", user_id);
        Ok(())
    }

    /// Vérifie la connexion au serveur
    pub async fn check_connection(&self) -> Result<bool, GraphQLClientError> {
        let query = r#"
            query HealthCheck {
                __typename
            }
        "#;

        let request = GraphQLRequest {
            query: query.to_string(),
            variables: serde_json::json!({}),
        };

        let response = self
            .client
            .post(&self.server_url)
            .json(&request)
            .timeout(std::time::Duration::from_secs(5))
            .send()
            .await;

        match response {
            Ok(resp) => Ok(resp.status().is_success()),
            Err(_) => Ok(false),
        }
    }
}

/// Erreurs du client GraphQL
#[derive(Debug)]
pub enum GraphQLClientError {
    NetworkError(String),
    ParseError(String),
    GraphQLError(String),
}

impl std::fmt::Display for GraphQLClientError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            GraphQLClientError::NetworkError(e) => write!(f, "Erreur réseau: {}", e),
            GraphQLClientError::ParseError(e) => write!(f, "Erreur parsing: {}", e),
            GraphQLClientError::GraphQLError(e) => write!(f, "Erreur GraphQL: {}", e),
        }
    }
}

impl std::error::Error for GraphQLClientError {}
