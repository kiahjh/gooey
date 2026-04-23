use chrono::Utc;
use dirs::home_dir;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::{
    fs,
    io::{ErrorKind, Write},
    path::{Path, PathBuf},
};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SidebarState {
    pub workspaces: Vec<WorkspaceWithSessions>,
    pub active_workspace_id: Option<String>,
    pub active_session_id: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceWithSessions {
    pub id: String,
    pub name: String,
    pub path: String,
    pub created_at: String,
    pub updated_at: String,
    pub last_opened_at: String,
    pub sessions: Vec<SessionRecord>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WorkspaceIndex {
    active_workspace_id: Option<String>,
    active_session_id: Option<String>,
    workspaces: Vec<WorkspaceRecord>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WorkspaceRecord {
    id: String,
    name: String,
    path: String,
    created_at: String,
    updated_at: String,
    last_opened_at: String,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionRecord {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    #[serde(default = "default_session_status")]
    pub status: SessionStatus,
    #[serde(default)]
    pub archived: bool,
    pub created_at: String,
    pub updated_at: String,
    pub events: Vec<SessionEvent>,
}

#[derive(Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SessionStatus {
    Idle,
    Unread,
    Working,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct SessionEvent {
    #[serde(rename = "type")]
    pub kind: String,
}

impl Default for WorkspaceIndex {
    fn default() -> Self {
        Self {
            active_workspace_id: None,
            active_session_id: None,
            workspaces: Vec::new(),
        }
    }
}

#[tauri::command]
pub fn get_sidebar_state() -> Result<SidebarState, String> {
    load_sidebar_state()
}

#[tauri::command]
pub fn add_workspace(path: String) -> Result<SidebarState, String> {
    let canonical_path = fs::canonicalize(PathBuf::from(path))
        .map_err(|error| format!("Failed to resolve folder: {error}"))?;

    if !canonical_path.is_dir() {
        return Err("Selected path is not a directory.".into());
    }

    let now = timestamp();
    let canonical_string = canonical_path.to_string_lossy().into_owned();
    let mut index = load_index()?;

    if let Some(existing_workspace) = index
        .workspaces
        .iter_mut()
        .find(|workspace| workspace.path == canonical_string)
    {
        existing_workspace.updated_at = now.clone();
        existing_workspace.last_opened_at = now;
        index.active_workspace_id = Some(existing_workspace.id.clone());
        index.active_session_id = latest_session_id(&existing_workspace.id)?;
        write_workspace_record(existing_workspace)?;
        save_index(&mut index)?;
        return load_sidebar_state();
    }

    let workspace = WorkspaceRecord {
        id: format!("ws_{}", Uuid::new_v4().simple()),
        name: workspace_name(&canonical_path),
        path: canonical_string,
        created_at: now.clone(),
        updated_at: now.clone(),
        last_opened_at: now,
    };

    index.active_workspace_id = Some(workspace.id.clone());
    index.active_session_id = None;
    index.workspaces.push(workspace.clone());

    create_workspace_dirs(&workspace.id)?;
    write_workspace_record(&workspace)?;
    save_index(&mut index)?;

    load_sidebar_state()
}

#[tauri::command]
pub fn create_session(workspace_id: String) -> Result<SidebarState, String> {
    let mut index = load_index()?;
    let workspace = index
        .workspaces
        .iter_mut()
        .find(|workspace| workspace.id == workspace_id)
        .ok_or_else(|| "Workspace not found.".to_string())?;

    let now = timestamp();
    let session = SessionRecord {
        id: format!("ses_{}", Uuid::new_v4().simple()),
        workspace_id: workspace.id.clone(),
        title: "Untitled".into(),
        status: SessionStatus::Idle,
        archived: false,
        created_at: now.clone(),
        updated_at: now.clone(),
        events: Vec::new(),
    };

    workspace.updated_at = now.clone();
    workspace.last_opened_at = now;
    write_workspace_record(workspace)?;
    write_session_record(&session)?;

    index.active_workspace_id = Some(workspace.id.clone());
    index.active_session_id = Some(session.id.clone());
    save_index(&mut index)?;

    load_sidebar_state()
}

#[tauri::command]
pub fn select_session(session_id: String) -> Result<SidebarState, String> {
    let mut index = load_index()?;
    let mut selected_workspace_id = None;

    for workspace in &index.workspaces {
        let sessions = load_sessions_for_workspace(&workspace.id)?;

        if sessions.iter().any(|session| session.id == session_id) {
            selected_workspace_id = Some(workspace.id.clone());
            break;
        }
    }

    let workspace_id = selected_workspace_id.ok_or_else(|| "Session not found.".to_string())?;

    if let Some(workspace) = index
        .workspaces
        .iter_mut()
        .find(|workspace| workspace.id == workspace_id)
    {
        write_workspace_record(workspace)?;
    }

    index.active_workspace_id = Some(workspace_id);
    index.active_session_id = Some(session_id);
    save_index(&mut index)?;

    load_sidebar_state()
}

#[tauri::command]
pub fn archive_session(session_id: String) -> Result<SidebarState, String> {
    let mut index = load_index()?;
    let now = timestamp();
    let mut archived_workspace_id = None;
    let mut archived_active_session = false;

    for workspace in index.workspaces.iter_mut() {
        let mut sessions = load_sessions_for_workspace(&workspace.id)?;
        let mut changed = false;

        for session in &mut sessions {
            if session.id == session_id {
                session.archived = true;
                session.updated_at = now.clone();
                write_session_record(session)?;
                workspace.updated_at = now.clone();
                write_workspace_record(workspace)?;
                archived_workspace_id = Some(workspace.id.clone());
                archived_active_session = index.active_session_id.as_deref() == Some(session.id.as_str());
                changed = true;
                break;
            }
        }

        if changed {
            break;
        }
    }

    let workspace_id =
        archived_workspace_id.ok_or_else(|| "Session not found.".to_string())?;

    if archived_active_session {
        index.active_session_id = next_visible_session_id(&workspace_id)?;
    }

    if index.active_workspace_id.as_deref() == Some(workspace_id.as_str())
        && index.active_session_id.is_none()
    {
        index.active_workspace_id = Some(workspace_id);
    }

    save_index(&mut index)?;

    load_sidebar_state()
}

fn load_sidebar_state() -> Result<SidebarState, String> {
    let mut index = load_index()?;
    normalize_session_statuses_to_idle(&index)?;

    let workspaces = index
        .workspaces
        .iter()
        .map(|workspace| {
            let mut sessions = load_sessions_for_workspace(&workspace.id)?;
            sessions.retain(|session| !session.archived);
            sessions.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));

            Ok(WorkspaceWithSessions {
                id: workspace.id.clone(),
                name: workspace.name.clone(),
                path: workspace.path.clone(),
                created_at: workspace.created_at.clone(),
                updated_at: workspace.updated_at.clone(),
                last_opened_at: workspace.last_opened_at.clone(),
                sessions,
            })
        })
        .collect::<Result<Vec<_>, String>>()?;

    if index.active_workspace_id.is_none() {
        index.active_workspace_id = workspaces.first().map(|workspace| workspace.id.clone());
    }

    if let Some(active_workspace_id) = &index.active_workspace_id {
        let active_session_exists = workspaces
            .iter()
            .find(|workspace| &workspace.id == active_workspace_id)
            .and_then(|workspace| {
                index.active_session_id.as_ref().and_then(|active_session_id| {
                    workspace
                        .sessions
                        .iter()
                        .find(|session| &session.id == active_session_id)
                })
            })
            .is_some();

        if !active_session_exists {
            index.active_session_id = None;
        }
    }

    save_index(&mut index)?;

    Ok(SidebarState {
        workspaces,
        active_workspace_id: index.active_workspace_id,
        active_session_id: index.active_session_id,
    })
}

fn load_sessions_for_workspace(workspace_id: &str) -> Result<Vec<SessionRecord>, String> {
    let sessions_directory = sessions_dir(workspace_id)?;

    if !sessions_directory.exists() {
        return Ok(Vec::new());
    }

    let mut sessions = Vec::new();

    for entry in
        fs::read_dir(&sessions_directory).map_err(|error| format!("Failed to read sessions: {error}"))?
    {
        let path = entry
            .map_err(|error| format!("Failed to read session entry: {error}"))?
            .path();

        if path.extension().and_then(|extension| extension.to_str()) != Some("json") {
            continue;
        }

        let session = read_json::<SessionRecord>(&path)?;
        sessions.push(session);
    }

    Ok(sessions)
}

fn latest_session_id(workspace_id: &str) -> Result<Option<String>, String> {
    let sessions = load_sessions_for_workspace(workspace_id)?;

    Ok(sessions
        .into_iter()
        .filter(|session| !session.archived)
        .max_by(|left, right| left.updated_at.cmp(&right.updated_at))
        .map(|session| session.id))
}

fn next_visible_session_id(workspace_id: &str) -> Result<Option<String>, String> {
    latest_session_id(workspace_id)
}

fn load_index() -> Result<WorkspaceIndex, String> {
    read_json_or_default(&index_file()?)
}

fn save_index(index: &mut WorkspaceIndex) -> Result<(), String> {
    write_json(&index_file()?, index)
}

fn write_workspace_record(workspace: &WorkspaceRecord) -> Result<(), String> {
    create_workspace_dirs(&workspace.id)?;
    write_json(&workspace_file(&workspace.id)?, workspace)
}

fn write_session_record(session: &SessionRecord) -> Result<(), String> {
    create_workspace_dirs(&session.workspace_id)?;
    write_json(&session_file(&session.workspace_id, &session.id)?, session)
}

fn normalize_session_statuses_to_idle(index: &WorkspaceIndex) -> Result<(), String> {
    for workspace in &index.workspaces {
        let mut sessions = load_sessions_for_workspace(&workspace.id)?;
        let mut changed = false;

        for session in &mut sessions {
            if session.status != SessionStatus::Idle {
                session.status = SessionStatus::Idle;
                changed = true;
            }
        }

        if changed {
            for session in &sessions {
                write_session_record(session)?;
            }
        }
    }

    Ok(())
}

fn write_json<T: Serialize>(path: &Path, value: &T) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Failed to create {}: {error}", parent.display()))?;
    }

    let serialized =
        serde_json::to_string_pretty(value).map_err(|error| format!("Failed to serialize JSON: {error}"))?;
    let mut file = fs::File::create(path)
        .map_err(|error| format!("Failed to create {}: {error}", path.display()))?;
    file.write_all(serialized.as_bytes())
        .map_err(|error| format!("Failed to write {}: {error}", path.display()))
}

fn read_json<T: DeserializeOwned>(path: &Path) -> Result<T, String> {
    let contents = fs::read_to_string(path)
        .map_err(|error| format!("Failed to read {}: {error}", path.display()))?;
    serde_json::from_str(&contents)
        .map_err(|error| format!("Failed to parse {}: {error}", path.display()))
}

fn read_json_or_default<T>(path: &Path) -> Result<T, String>
where
    T: DeserializeOwned + Default,
{
    match fs::read_to_string(path) {
        Ok(contents) => serde_json::from_str(&contents)
            .map_err(|error| format!("Failed to parse {}: {error}", path.display())),
        Err(error) if error.kind() == ErrorKind::NotFound => Ok(T::default()),
        Err(error) => Err(format!("Failed to read {}: {error}", path.display())),
    }
}

fn create_workspace_dirs(workspace_id: &str) -> Result<(), String> {
    let workspace_directory = workspace_dir(workspace_id)?;
    fs::create_dir_all(workspace_directory.join("sessions"))
        .map_err(|error| format!("Failed to prepare workspace storage: {error}"))
}

fn gooey_home_dir() -> Result<PathBuf, String> {
    let directory = std::env::var_os("GOOEY_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            home_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join(".gooey")
        });
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Failed to create {}: {error}", directory.display()))?;
    Ok(directory)
}

fn workspaces_root() -> Result<PathBuf, String> {
    let directory = gooey_home_dir()?.join("workspaces");
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Failed to create {}: {error}", directory.display()))?;
    Ok(directory)
}

fn index_file() -> Result<PathBuf, String> {
    Ok(gooey_home_dir()?.join("workspaces.json"))
}

fn workspace_dir(workspace_id: &str) -> Result<PathBuf, String> {
    Ok(workspaces_root()?.join(workspace_id))
}

fn workspace_file(workspace_id: &str) -> Result<PathBuf, String> {
    Ok(workspace_dir(workspace_id)?.join("workspace.json"))
}

fn sessions_dir(workspace_id: &str) -> Result<PathBuf, String> {
    Ok(workspace_dir(workspace_id)?.join("sessions"))
}

fn session_file(workspace_id: &str, session_id: &str) -> Result<PathBuf, String> {
    Ok(sessions_dir(workspace_id)?.join(format!("{session_id}.json")))
}

fn workspace_name(path: &Path) -> String {
    path.file_name()
        .and_then(|name| name.to_str())
        .filter(|name| !name.is_empty())
        .map(ToOwned::to_owned)
        .unwrap_or_else(|| path.to_string_lossy().into_owned())
}

fn timestamp() -> String {
    Utc::now().to_rfc3339()
}

fn default_session_status() -> SessionStatus {
    SessionStatus::Idle
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Mutex, OnceLock};

    fn test_env_lock() -> &'static Mutex<()> {
        static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
        LOCK.get_or_init(|| Mutex::new(()))
    }

    struct TestHomeGuard {
        previous_home: Option<std::ffi::OsString>,
        path: PathBuf,
    }

    impl TestHomeGuard {
        fn new() -> Self {
            let path =
                std::env::temp_dir().join(format!("gooey-test-home-{}", Uuid::new_v4().simple()));
            let previous_home = std::env::var_os("GOOEY_HOME");
            std::env::set_var("GOOEY_HOME", &path);

            Self {
                previous_home,
                path,
            }
        }
    }

    impl Drop for TestHomeGuard {
        fn drop(&mut self) {
            if let Some(previous_home) = &self.previous_home {
                std::env::set_var("GOOEY_HOME", previous_home);
            } else {
                std::env::remove_var("GOOEY_HOME");
            }

            let _ = fs::remove_dir_all(&self.path);
        }
    }

    #[test]
    fn persists_workspaces_and_sessions() {
        let _lock = test_env_lock().lock().unwrap();
        let _home = TestHomeGuard::new();
        let fixture_path = fs::canonicalize("../")
            .expect("expected the repo root fixture path to resolve");

        let first_snapshot =
            add_workspace(fixture_path.to_string_lossy().into_owned()).expect("workspace added");

        assert_eq!(first_snapshot.workspaces.len(), 1);
        assert_eq!(
            first_snapshot.active_workspace_id,
            Some(first_snapshot.workspaces[0].id.clone())
        );

        let second_snapshot = create_session(first_snapshot.workspaces[0].id.clone())
            .expect("session created");

        assert_eq!(second_snapshot.workspaces[0].sessions.len(), 1);
        assert_eq!(
            second_snapshot.active_session_id,
            Some(second_snapshot.workspaces[0].sessions[0].id.clone())
        );

        let reloaded_snapshot = get_sidebar_state().expect("snapshot reload succeeded");

        assert_eq!(reloaded_snapshot.workspaces.len(), 1);
        assert_eq!(reloaded_snapshot.workspaces[0].sessions.len(), 1);
        assert_eq!(
            reloaded_snapshot.active_session_id,
            Some(reloaded_snapshot.workspaces[0].sessions[0].id.clone())
        );
        assert!(matches!(
            reloaded_snapshot.workspaces[0].sessions[0].status,
            SessionStatus::Idle
        ));
        assert!(!reloaded_snapshot.workspaces[0].sessions[0].archived);
    }

    #[test]
    fn selecting_a_session_does_not_reorder_workspaces() {
        let _lock = test_env_lock().lock().unwrap();
        let _home = TestHomeGuard::new();
        let projects_root =
            std::env::temp_dir().join(format!("gooey-test-projects-{}", Uuid::new_v4().simple()));
        let first_project = projects_root.join("alpha");
        let second_project = projects_root.join("beta");

        fs::create_dir_all(&first_project).expect("first project created");
        fs::create_dir_all(&second_project).expect("second project created");

        let first_snapshot =
            add_workspace(first_project.to_string_lossy().into_owned()).expect("first workspace");
        let second_snapshot =
            add_workspace(second_project.to_string_lossy().into_owned()).expect("second workspace");
        let with_first_session =
            create_session(first_snapshot.workspaces[0].id.clone()).expect("first session");
        let with_both_sessions =
            create_session(second_snapshot.workspaces[1].id.clone()).expect("second session");
        let selected_snapshot = select_session(with_both_sessions.workspaces[1].sessions[0].id.clone())
            .expect("selected second workspace session");

        assert_eq!(selected_snapshot.workspaces.len(), 2);
        assert_eq!(selected_snapshot.workspaces[0].name, "alpha");
        assert_eq!(selected_snapshot.workspaces[1].name, "beta");
        assert_eq!(
            selected_snapshot.active_workspace_id,
            Some(with_both_sessions.workspaces[1].id.clone())
        );

        let _ = fs::remove_dir_all(&projects_root);
        let _ = with_first_session;
    }

    #[test]
    fn selecting_a_session_does_not_change_statuses() {
        let _lock = test_env_lock().lock().unwrap();
        let _home = TestHomeGuard::new();
        let fixture_path = fs::canonicalize("../")
            .expect("expected the repo root fixture path to resolve");

        let workspace_snapshot =
            add_workspace(fixture_path.to_string_lossy().into_owned()).expect("workspace added");
        let first_session_snapshot =
            create_session(workspace_snapshot.workspaces[0].id.clone()).expect("first session");
        let second_session_snapshot =
            create_session(workspace_snapshot.workspaces[0].id.clone()).expect("second session");
        let selected_first_session =
            select_session(first_session_snapshot.workspaces[0].sessions[0].id.clone())
                .expect("selected first session");

        let sessions = &selected_first_session.workspaces[0].sessions;
        assert_eq!(sessions.len(), 2);
        assert!(sessions
            .iter()
            .all(|session| matches!(session.status, SessionStatus::Idle)));
        assert_eq!(
            selected_first_session.active_session_id,
            Some(first_session_snapshot.workspaces[0].sessions[0].id.clone())
        );

        let _ = second_session_snapshot;
    }

    #[test]
    fn stale_non_idle_statuses_are_normalized_on_load() {
        let _lock = test_env_lock().lock().unwrap();
        let _home = TestHomeGuard::new();
        let fixture_path = fs::canonicalize("../")
            .expect("expected the repo root fixture path to resolve");

        let workspace_snapshot =
            add_workspace(fixture_path.to_string_lossy().into_owned()).expect("workspace added");
        let session_id = format!("ses_{}", Uuid::new_v4().simple());
        let stale_session = SessionRecord {
            id: session_id.clone(),
            workspace_id: workspace_snapshot.workspaces[0].id.clone(),
            title: "Stale status".into(),
            status: SessionStatus::Working,
            archived: false,
            created_at: timestamp(),
            updated_at: timestamp(),
            events: Vec::new(),
        };

        write_session_record(&stale_session).expect("wrote stale session");

        let reloaded_snapshot = get_sidebar_state().expect("snapshot reload succeeded");
        let normalized = reloaded_snapshot.workspaces[0]
            .sessions
            .iter()
            .find(|session| session.id == session_id)
            .expect("normalized session found");

        assert!(matches!(normalized.status, SessionStatus::Idle));
    }

    #[test]
    fn archiving_a_session_hides_it_from_the_sidebar_but_keeps_it_on_disk() {
        let _lock = test_env_lock().lock().unwrap();
        let _home = TestHomeGuard::new();
        let fixture_path = fs::canonicalize("../")
            .expect("expected the repo root fixture path to resolve");

        let workspace_snapshot =
            add_workspace(fixture_path.to_string_lossy().into_owned()).expect("workspace added");
        let created_snapshot =
            create_session(workspace_snapshot.workspaces[0].id.clone()).expect("session created");
        let session_id = created_snapshot.workspaces[0].sessions[0].id.clone();

        let archived_snapshot = archive_session(session_id.clone()).expect("session archived");

        assert!(archived_snapshot.workspaces[0].sessions.is_empty());

        let stored_sessions =
            load_sessions_for_workspace(&workspace_snapshot.workspaces[0].id).expect("sessions loaded");
        let archived = stored_sessions
            .iter()
            .find(|session| session.id == session_id)
            .expect("archived session still stored");

        assert!(archived.archived);
    }
}
