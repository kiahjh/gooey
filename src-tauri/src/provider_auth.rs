use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use chrono::{DateTime, Duration, Utc};
use rand::{distributions::Alphanumeric, Rng};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::BTreeMap,
    fs::{self, OpenOptions},
    io::{BufRead, BufReader, Write},
    net::{TcpListener, TcpStream},
    path::PathBuf,
    sync::mpsc,
    thread,
    time::{Duration as StdDuration, Instant},
};
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;
use url::Url;

const CLIENT_ID: &str = "app_EMoamEEZ73f0CkXaXp7hrann";
const ISSUER: &str = "https://auth.openai.com";
const OAUTH_PORT: u16 = 1455;
const AUTH_TIMEOUT: StdDuration = StdDuration::from_secs(5 * 60);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderConnectionStatus {
    pub provider: String,
    pub method: Option<String>,
    pub connected: bool,
    pub account_id: Option<String>,
    pub expires_at: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderModel {
    pub id: String,
    pub label: String,
    pub provider: String,
    pub provider_label: String,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
enum ProviderAuthRecord {
    ChatgptSubscription {
        refresh: String,
        access: String,
        expires_at: String,
        #[serde(default)]
        account_id: Option<String>,
    },
}

type AuthFile = BTreeMap<String, ProviderAuthRecord>;

#[derive(Deserialize)]
struct TokenResponse {
    id_token: Option<String>,
    access_token: String,
    refresh_token: String,
    expires_in: Option<i64>,
}

struct PkceCodes {
    verifier: String,
    challenge: String,
}

enum CallbackResult {
    Code(String),
    Error(String),
}

#[tauri::command]
pub fn get_openai_connection_status() -> Result<ProviderConnectionStatus, String> {
    openai_status()
}

#[tauri::command]
pub async fn connect_openai_chatgpt_account(
    app: AppHandle,
) -> Result<ProviderConnectionStatus, String> {
    let pkce = generate_pkce();
    let state = generate_state();
    let callback = OAuthCallbackServer::start(state.clone())?;
    let redirect_uri = callback.redirect_uri.clone();
    let authorization_url = build_authorization_url(&redirect_uri, &pkce, &state);

    app.opener()
        .open_url(authorization_url, None::<&str>)
        .map_err(|error| format!("Failed to open browser: {error}"))?;

    let code = tauri::async_runtime::spawn_blocking(move || callback.wait())
        .await
        .map_err(|error| format!("OAuth callback failed: {error}"))??;

    let tokens = exchange_code_for_tokens(&code, &redirect_uri, &pkce).await?;
    persist_openai_subscription(tokens)?;
    openai_status()
}

#[tauri::command]
pub fn disconnect_openai_chatgpt_account() -> Result<ProviderConnectionStatus, String> {
    let mut auth = read_auth_file()?;
    auth.remove("openai");
    write_auth_file(&auth)?;
    openai_status()
}

#[tauri::command]
pub async fn refresh_openai_chatgpt_account() -> Result<ProviderConnectionStatus, String> {
    refresh_openai_access_token_if_needed().await?;
    openai_status()
}

#[tauri::command]
pub async fn get_configured_provider_models() -> Result<Vec<ProviderModel>, String> {
    refresh_openai_access_token_if_needed().await?;

    let auth = read_auth_file()?;
    let mut models = Vec::new();

    if matches!(
        auth.get("openai"),
        Some(ProviderAuthRecord::ChatgptSubscription { .. })
    ) {
        models.extend(openai_chatgpt_subscription_models());
    }

    Ok(models)
}

fn openai_status() -> Result<ProviderConnectionStatus, String> {
    let auth = read_auth_file()?;
    let record = auth.get("openai");

    Ok(match record {
        Some(ProviderAuthRecord::ChatgptSubscription {
            account_id,
            expires_at,
            ..
        }) => ProviderConnectionStatus {
            provider: "openai".into(),
            method: Some("chatgptSubscription".into()),
            connected: true,
            account_id: account_id.clone(),
            expires_at: Some(expires_at.clone()),
        },
        None => ProviderConnectionStatus {
            provider: "openai".into(),
            method: None,
            connected: false,
            account_id: None,
            expires_at: None,
        },
    })
}

fn persist_openai_subscription(tokens: TokenResponse) -> Result<(), String> {
    let expires_at = Utc::now()
        .checked_add_signed(Duration::seconds(tokens.expires_in.unwrap_or(3600)))
        .unwrap_or_else(|| Utc::now() + Duration::hours(1));
    let account_id = extract_account_id(&tokens);
    let mut auth = read_auth_file()?;

    auth.insert(
        "openai".into(),
        ProviderAuthRecord::ChatgptSubscription {
            refresh: tokens.refresh_token,
            access: tokens.access_token,
            expires_at: expires_at.to_rfc3339(),
            account_id,
        },
    );

    write_auth_file(&auth)
}

fn openai_chatgpt_subscription_models() -> Vec<ProviderModel> {
    [
        ("openai/gpt-5.4", "GPT-5.4"),
        ("openai/gpt-5.4-mini", "GPT-5.4 Mini"),
        ("openai/gpt-5.3-codex", "GPT-5.3 Codex"),
        ("openai/gpt-5.2", "GPT-5.2"),
        ("openai/gpt-5.2-codex", "GPT-5.2 Codex"),
        ("openai/gpt-5.1-codex", "GPT-5.1 Codex"),
        ("openai/gpt-5.1-codex-max", "GPT-5.1 Codex Max"),
        ("openai/gpt-5.1-codex-mini", "GPT-5.1 Codex Mini"),
    ]
    .into_iter()
    .map(|(id, label)| ProviderModel {
        id: id.into(),
        label: label.into(),
        provider: "openai".into(),
        provider_label: "OpenAI".into(),
    })
    .collect()
}

async fn exchange_code_for_tokens(
    code: &str,
    redirect_uri: &str,
    pkce: &PkceCodes,
) -> Result<TokenResponse, String> {
    let body = url::form_urlencoded::Serializer::new(String::new())
        .append_pair("grant_type", "authorization_code")
        .append_pair("code", code)
        .append_pair("redirect_uri", redirect_uri)
        .append_pair("client_id", CLIENT_ID)
        .append_pair("code_verifier", &pkce.verifier)
        .finish();

    let response = reqwest::Client::new()
        .post(format!("{ISSUER}/oauth/token"))
        .header("content-type", "application/x-www-form-urlencoded")
        .body(body)
        .send()
        .await
        .map_err(|error| format!("Token exchange failed: {error}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "Token exchange failed with status {}",
            response.status()
        ));
    }

    response
        .json::<TokenResponse>()
        .await
        .map_err(|error| format!("Failed to read token response: {error}"))
}

async fn refresh_openai_access_token_if_needed() -> Result<(), String> {
    let mut auth = read_auth_file()?;
    let Some(ProviderAuthRecord::ChatgptSubscription {
        refresh,
        access: _,
        expires_at,
        account_id,
    }) = auth.get("openai").cloned()
    else {
        return Ok(());
    };

    let expires_at = DateTime::parse_from_rfc3339(&expires_at)
        .map_err(|error| format!("Failed to parse OpenAI token expiry: {error}"))?
        .with_timezone(&Utc);

    if expires_at > Utc::now() + Duration::minutes(2) {
        return Ok(());
    }

    let body = url::form_urlencoded::Serializer::new(String::new())
        .append_pair("grant_type", "refresh_token")
        .append_pair("refresh_token", &refresh)
        .append_pair("client_id", CLIENT_ID)
        .finish();

    let response = reqwest::Client::new()
        .post(format!("{ISSUER}/oauth/token"))
        .header("content-type", "application/x-www-form-urlencoded")
        .body(body)
        .send()
        .await
        .map_err(|error| format!("Token refresh failed: {error}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "Token refresh failed with status {}",
            response.status()
        ));
    }

    let tokens = response
        .json::<TokenResponse>()
        .await
        .map_err(|error| format!("Failed to read token refresh response: {error}"))?;

    let next_expires_at = Utc::now()
        .checked_add_signed(Duration::seconds(tokens.expires_in.unwrap_or(3600)))
        .unwrap_or_else(|| Utc::now() + Duration::hours(1));
    let next_account_id = extract_account_id(&tokens).or(account_id);

    auth.insert(
        "openai".into(),
        ProviderAuthRecord::ChatgptSubscription {
            refresh: tokens.refresh_token,
            access: tokens.access_token,
            expires_at: next_expires_at.to_rfc3339(),
            account_id: next_account_id,
        },
    );

    write_auth_file(&auth)
}

fn build_authorization_url(redirect_uri: &str, pkce: &PkceCodes, state: &str) -> String {
    let mut url = Url::parse(&format!("{ISSUER}/oauth/authorize")).expect("valid issuer URL");
    url.query_pairs_mut()
        .append_pair("response_type", "code")
        .append_pair("client_id", CLIENT_ID)
        .append_pair("redirect_uri", redirect_uri)
        .append_pair("scope", "openid profile email offline_access")
        .append_pair("code_challenge", &pkce.challenge)
        .append_pair("code_challenge_method", "S256")
        .append_pair("id_token_add_organizations", "true")
        .append_pair("codex_cli_simplified_flow", "true")
        .append_pair("state", state)
        .append_pair("originator", "opencode");
    url.to_string()
}

fn generate_pkce() -> PkceCodes {
    let verifier: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(64)
        .map(char::from)
        .collect();
    let challenge = URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()));

    PkceCodes {
        verifier,
        challenge,
    }
}

fn generate_state() -> String {
    let bytes: [u8; 32] = rand::random();
    URL_SAFE_NO_PAD.encode(bytes)
}

fn extract_account_id(tokens: &TokenResponse) -> Option<String> {
    tokens
        .id_token
        .as_deref()
        .and_then(extract_account_id_from_jwt)
        .or_else(|| extract_account_id_from_jwt(&tokens.access_token))
}

fn extract_account_id_from_jwt(token: &str) -> Option<String> {
    let payload = token.split('.').nth(1)?;
    let decoded = URL_SAFE_NO_PAD.decode(payload).ok()?;
    let claims = serde_json::from_slice::<serde_json::Value>(&decoded).ok()?;

    claims
        .get("chatgpt_account_id")
        .and_then(|value| value.as_str())
        .or_else(|| {
            claims
                .get("https://api.openai.com/auth")
                .and_then(|value| value.get("chatgpt_account_id"))
                .and_then(|value| value.as_str())
        })
        .or_else(|| {
            claims
                .get("organizations")
                .and_then(|value| value.as_array())
                .and_then(|organizations| organizations.first())
                .and_then(|organization| organization.get("id"))
                .and_then(|value| value.as_str())
        })
        .map(ToOwned::to_owned)
}

struct OAuthCallbackServer {
    redirect_uri: String,
    receiver: mpsc::Receiver<Result<String, String>>,
}

impl OAuthCallbackServer {
    fn start(expected_state: String) -> Result<Self, String> {
        let listener = TcpListener::bind(("127.0.0.1", OAUTH_PORT))
            .map_err(|error| format!("Failed to start OAuth callback server: {error}"))?;
        listener
            .set_nonblocking(true)
            .map_err(|error| format!("Failed to configure OAuth callback server: {error}"))?;
        let redirect_uri = format!("http://localhost:{OAUTH_PORT}/auth/callback");
        let (sender, receiver) = mpsc::channel();

        thread::spawn(move || {
            let result = wait_for_callback(listener, &expected_state);
            let _ = sender.send(result);
        });

        Ok(Self {
            redirect_uri,
            receiver,
        })
    }

    fn wait(self) -> Result<String, String> {
        self.receiver
            .recv_timeout(AUTH_TIMEOUT + StdDuration::from_secs(2))
            .map_err(|_| "Timed out waiting for ChatGPT authorization.".to_string())?
    }
}

fn wait_for_callback(listener: TcpListener, expected_state: &str) -> Result<String, String> {
    let deadline = Instant::now() + AUTH_TIMEOUT;

    while Instant::now() < deadline {
        match listener.accept() {
            Ok((mut stream, _)) => match handle_callback_stream(&mut stream, expected_state) {
                Some(CallbackResult::Code(code)) => return Ok(code),
                Some(CallbackResult::Error(error)) => return Err(error),
                None => continue,
            },
            Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                thread::sleep(StdDuration::from_millis(100));
            }
            Err(error) => return Err(format!("OAuth callback server failed: {error}")),
        }
    }

    Err("Timed out waiting for ChatGPT authorization.".into())
}

fn handle_callback_stream(stream: &mut TcpStream, expected_state: &str) -> Option<CallbackResult> {
    let mut request_line = String::new();

    {
        let mut reader = BufReader::new(&mut *stream);
        if reader.read_line(&mut request_line).is_err() {
            write_http_response(stream, 400, HTML_ERROR);
            return Some(CallbackResult::Error(
                "Invalid OAuth callback request.".into(),
            ));
        }
    }

    let target = request_line.split_whitespace().nth(1)?;
    let url = Url::parse(&format!("http://127.0.0.1{target}")).ok()?;

    if url.path() != "/auth/callback" {
        write_http_response(stream, 404, "Not found");
        return None;
    }

    if let Some(error) = url
        .query_pairs()
        .find_map(|(key, value)| (key == "error").then_some(value.into_owned()))
    {
        let error_description = url
            .query_pairs()
            .find_map(|(key, value)| (key == "error_description").then_some(value.into_owned()))
            .unwrap_or(error);
        write_http_response(stream, 200, HTML_ERROR);
        return Some(CallbackResult::Error(error_description));
    }

    let code = url
        .query_pairs()
        .find_map(|(key, value)| (key == "code").then_some(value.into_owned()));
    let state = url
        .query_pairs()
        .find_map(|(key, value)| (key == "state").then_some(value.into_owned()));

    match (code, state) {
        (Some(code), Some(state)) if state == expected_state => {
            write_http_response(stream, 200, HTML_SUCCESS);
            Some(CallbackResult::Code(code))
        }
        (Some(_), Some(_)) => {
            write_http_response(stream, 400, HTML_ERROR);
            Some(CallbackResult::Error(
                "OAuth state mismatch. Please try connecting again.".into(),
            ))
        }
        _ => {
            write_http_response(stream, 400, HTML_ERROR);
            Some(CallbackResult::Error(
                "Missing authorization code in OAuth callback.".into(),
            ))
        }
    }
}

fn write_http_response(stream: &mut TcpStream, status: u16, body: &str) {
    let status_text = match status {
        200 => "OK",
        400 => "Bad Request",
        404 => "Not Found",
        _ => "OK",
    };
    let response = format!(
        "HTTP/1.1 {status} {status_text}\r\ncontent-type: text/html; charset=utf-8\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{body}",
        body.len()
    );
    let _ = stream.write_all(response.as_bytes());
}

fn read_auth_file() -> Result<AuthFile, String> {
    let path = auth_file()?;

    match fs::read_to_string(&path) {
        Ok(contents) => serde_json::from_str(&contents)
            .map_err(|error| format!("Failed to parse {}: {error}", path.display())),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(AuthFile::new()),
        Err(error) => Err(format!("Failed to read {}: {error}", path.display())),
    }
}

fn write_auth_file(value: &AuthFile) -> Result<(), String> {
    let path = auth_file()?;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Failed to create {}: {error}", parent.display()))?;
    }

    let serialized = serde_json::to_string_pretty(value)
        .map_err(|error| format!("Failed to serialize auth data: {error}"))?;

    let mut options = OpenOptions::new();
    options.create(true).truncate(true).write(true);

    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }

    let mut file = options
        .open(&path)
        .map_err(|error| format!("Failed to create {}: {error}", path.display()))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = file.set_permissions(fs::Permissions::from_mode(0o600));
    }

    file.write_all(serialized.as_bytes())
        .map_err(|error| format!("Failed to write {}: {error}", path.display()))
}

fn auth_file() -> Result<PathBuf, String> {
    Ok(gooey_home_dir()?.join("auth.json"))
}

fn gooey_home_dir() -> Result<PathBuf, String> {
    let directory = std::env::var_os("GOOEY_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            dirs::home_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join(".gooey")
        });
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Failed to create {}: {error}", directory.display()))?;
    Ok(directory)
}

const HTML_SUCCESS: &str = r#"<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Gooey authorization complete</title>
    <style>
      body {
        align-items: center;
        background: #1d1a17;
        color: #f2eeea;
        display: flex;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        height: 100vh;
        justify-content: center;
        margin: 0;
      }
      main {
        max-width: 420px;
        padding: 32px;
        text-align: center;
      }
      p { color: #a8a098; }
    </style>
  </head>
  <body>
    <main>
      <h1>Connected to Gooey</h1>
      <p>You can close this window and return to settings.</p>
    </main>
  </body>
</html>"#;

const HTML_ERROR: &str = r#"<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Gooey authorization failed</title>
    <style>
      body {
        align-items: center;
        background: #1d1a17;
        color: #f2eeea;
        display: flex;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        height: 100vh;
        justify-content: center;
        margin: 0;
      }
      main {
        max-width: 420px;
        padding: 32px;
        text-align: center;
      }
      p { color: #a8a098; }
    </style>
  </head>
  <body>
    <main>
      <h1>Connection failed</h1>
      <p>Return to Gooey and try connecting again.</p>
    </main>
  </body>
</html>"#;
