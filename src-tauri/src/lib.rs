use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    io::{BufRead, BufReader, Write},
    path::PathBuf,
    process::{Command, Stdio},
};
use tauri::{Emitter, Window};

#[derive(Serialize)]
struct RuntimeRequest {
    id: String,
    method: String,
    params: Value,
}

#[derive(Deserialize)]
struct RuntimeResponse {
    ok: bool,
    result: Option<Value>,
    error: Option<String>,
}

#[derive(Deserialize)]
struct RuntimeStreamLine {
    event: Option<Value>,
    ok: Option<bool>,
    result: Option<Value>,
    error: Option<String>,
}

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
                x: 33,
                y: 50,
            }));
    }

    #[cfg(not(target_os = "macos"))]
    {
        builder = builder.decorations(true);
    }

    builder.build()?;
    Ok(())
}

fn runtime_script_path() -> Result<PathBuf, String> {
    runtime_script_named("cli.ts")
}

fn runtime_stream_script_path() -> Result<PathBuf, String> {
    runtime_script_named("stream-cli.ts")
}

fn runtime_script_named(script_name: &str) -> Result<PathBuf, String> {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let repo_root = manifest_dir
        .parent()
        .ok_or_else(|| "Failed to locate Gooey repository root.".to_string())?;
    Ok(repo_root.join("runtime").join(script_name))
}

async fn call_runtime(method: &str, params: Value) -> Result<Value, String> {
    let method = method.to_owned();

    tauri::async_runtime::spawn_blocking(move || {
        let request = RuntimeRequest {
            id: uuid::Uuid::new_v4().simple().to_string(),
            method,
            params,
        };
        let serialized = serde_json::to_vec(&request)
            .map_err(|error| format!("Failed to serialize runtime request: {error}"))?;
        let bun = std::env::var("BUN_PATH").unwrap_or_else(|_| "bun".into());
        let script = runtime_script_path()?;
        let repo_root = script
            .parent()
            .and_then(|runtime_dir| runtime_dir.parent())
            .ok_or_else(|| "Failed to locate runtime working directory.".to_string())?
            .to_path_buf();
        let mut child = Command::new(bun)
            .arg(&script)
            .current_dir(&repo_root)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|error| format!("Failed to start Gooey runtime: {error}"))?;

        let mut stdin = child
            .stdin
            .take()
            .ok_or_else(|| "Failed to open runtime stdin.".to_string())?;
        stdin
            .write_all(&serialized)
            .map_err(|error| format!("Failed to write runtime request: {error}"))?;
        drop(stdin);

        let output = child
            .wait_with_output()
            .map_err(|error| format!("Runtime command failed: {error}"))?;
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_owned();

        if !output.status.success() {
            return Err(if stderr.is_empty() {
                format!("Runtime exited with status {}", output.status)
            } else {
                stderr
            });
        }

        let response: RuntimeResponse = serde_json::from_slice(&output.stdout).map_err(|error| {
            let stdout = String::from_utf8_lossy(&output.stdout);
            format!("Failed to parse runtime response: {error}. Output: {stdout}")
        })?;

        if response.ok {
            Ok(response.result.unwrap_or(Value::Null))
        } else {
            Err(response
                .error
                .unwrap_or_else(|| "Runtime command failed.".into()))
        }
    })
    .await
    .map_err(|error| format!("Runtime task failed: {error}"))?
}

async fn call_runtime_stream(
    window: Window,
    method: &str,
    params: Value,
) -> Result<Value, String> {
    let method = method.to_owned();

    tauri::async_runtime::spawn_blocking(move || {
        let request_id = uuid::Uuid::new_v4().simple().to_string();
        let request = RuntimeRequest {
            id: request_id.clone(),
            method,
            params,
        };
        let serialized = serde_json::to_vec(&request)
            .map_err(|error| format!("Failed to serialize runtime request: {error}"))?;
        let bun = std::env::var("BUN_PATH").unwrap_or_else(|_| "bun".into());
        let script = runtime_stream_script_path()?;
        let repo_root = script
            .parent()
            .and_then(|runtime_dir| runtime_dir.parent())
            .ok_or_else(|| "Failed to locate runtime working directory.".to_string())?
            .to_path_buf();
        let mut child = Command::new(bun)
            .arg(&script)
            .current_dir(&repo_root)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|error| format!("Failed to start Gooey runtime: {error}"))?;

        let mut stdin = child
            .stdin
            .take()
            .ok_or_else(|| "Failed to open runtime stdin.".to_string())?;
        stdin
            .write_all(&serialized)
            .map_err(|error| format!("Failed to write runtime request: {error}"))?;
        drop(stdin);

        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "Failed to open runtime stdout.".to_string())?;
        let mut final_result = Value::Null;
        let mut final_error: Option<String> = None;

        for line in BufReader::new(stdout).lines() {
            let line = line.map_err(|error| format!("Failed to read runtime stream: {error}"))?;
            if line.trim().is_empty() {
                continue;
            }

            let parsed: RuntimeStreamLine = serde_json::from_str(&line)
                .map_err(|error| format!("Failed to parse runtime stream line: {error}. Line: {line}"))?;

            if let Some(event) = parsed.event {
                window
                    .emit("gooey://prompt-stream", event)
                    .map_err(|error| format!("Failed to emit runtime event: {error}"))?;
            } else if let Some(ok) = parsed.ok {
                if ok {
                    final_result = parsed.result.unwrap_or(Value::Null);
                } else {
                    final_error = Some(
                        parsed
                            .error
                            .unwrap_or_else(|| "Runtime stream command failed.".into()),
                    );
                }
            }
        }

        let output = child
            .wait_with_output()
            .map_err(|error| format!("Runtime stream command failed: {error}"))?;
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_owned();

        if !output.status.success() {
            return Err(if stderr.is_empty() {
                format!("Runtime exited with status {}", output.status)
            } else {
                stderr
            });
        }

        if let Some(error) = final_error {
            Err(error)
        } else {
            Ok(final_result)
        }
    })
    .await
    .map_err(|error| format!("Runtime stream task failed: {error}"))?
}

#[tauri::command]
async fn get_sidebar_state() -> Result<Value, String> {
    call_runtime("get_sidebar_state", json!({})).await
}

#[tauri::command]
async fn add_workspace(path: String) -> Result<Value, String> {
    call_runtime("add_workspace", json!({ "path": path })).await
}

#[tauri::command]
async fn create_session(workspace_id: String) -> Result<Value, String> {
    call_runtime("create_session", json!({ "workspaceId": workspace_id })).await
}

#[tauri::command]
async fn archive_session(session_id: String) -> Result<Value, String> {
    call_runtime("archive_session", json!({ "sessionId": session_id })).await
}

#[tauri::command]
async fn select_session(session_id: String) -> Result<Value, String> {
    call_runtime("select_session", json!({ "sessionId": session_id })).await
}

#[tauri::command]
async fn get_openai_connection_status() -> Result<Value, String> {
    call_runtime("get_openai_connection_status", json!({})).await
}

#[tauri::command]
async fn connect_openai_chatgpt_account() -> Result<Value, String> {
    call_runtime("connect_openai_chatgpt_account", json!({})).await
}

#[tauri::command]
async fn disconnect_openai_chatgpt_account() -> Result<Value, String> {
    call_runtime("disconnect_openai_chatgpt_account", json!({})).await
}

#[tauri::command]
async fn refresh_openai_chatgpt_account() -> Result<Value, String> {
    call_runtime("refresh_openai_chatgpt_account", json!({})).await
}

#[tauri::command]
async fn get_configured_provider_models() -> Result<Value, String> {
    call_runtime("get_configured_provider_models", json!({})).await
}

#[tauri::command]
async fn send_prompt(
    window: Window,
    session_id: String,
    prompt: String,
    model_id: String,
) -> Result<Value, String> {
    call_runtime_stream(
        window,
        "send_prompt",
        json!({
            "sessionId": session_id,
            "prompt": prompt,
            "modelId": model_id,
        }),
    )
    .await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_sidebar_state,
            add_workspace,
            archive_session,
            create_session,
            select_session,
            get_openai_connection_status,
            connect_openai_chatgpt_account,
            disconnect_openai_chatgpt_account,
            refresh_openai_chatgpt_account,
            get_configured_provider_models,
            send_prompt
        ])
        .setup(|app| {
            create_main_window(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
