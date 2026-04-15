//! Recent projects tracking
//!
//! Manages a list of recently opened projects, stored in the user's app data directory.
//! Format: ~/.plc-ide/recent.json (platform-specific location)

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

const MAX_RECENT_PROJECTS: usize = 10;
const RECENT_FILE_NAME: &str = "recent.json";

/// Recent project entry
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RecentProject {
    /// Absolute path to the project file
    pub path: String,

    /// Project name (for display)
    pub name: String,

    /// Last opened timestamp (ISO 8601)
    pub last_opened: String,
}

/// Recent projects list
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentProjects {
    pub projects: Vec<RecentProject>,
}

impl Default for RecentProjects {
    fn default() -> Self {
        Self::new()
    }
}

impl RecentProjects {
    /// Create a new empty recent projects list
    pub fn new() -> Self {
        Self {
            projects: Vec::new(),
        }
    }

    /// Load recent projects from disk
    pub fn load() -> Result<Self, String> {
        let path = Self::get_recent_file_path()?;

        if !path.exists() {
            return Ok(Self::new());
        }

        let json = std::fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read recent projects: {}", e))?;

        serde_json::from_str(&json).map_err(|e| format!("Failed to parse recent projects: {}", e))
    }

    /// Save recent projects to disk
    pub fn save(&self) -> Result<(), String> {
        let path = Self::get_recent_file_path()?;

        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create app data directory: {}", e))?;
        }

        let json = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize recent projects: {}", e))?;

        std::fs::write(&path, json).map_err(|e| format!("Failed to write recent projects: {}", e))
    }

    /// Add a project to the recent list (or update timestamp if already present)
    pub fn add(&mut self, path: String, name: String) {
        let now = chrono::Utc::now().to_rfc3339();

        // Remove existing entry if present
        self.projects.retain(|p| p.path != path);

        // Add to front
        self.projects.insert(
            0,
            RecentProject {
                path,
                name,
                last_opened: now,
            },
        );

        // Trim to max size
        self.projects.truncate(MAX_RECENT_PROJECTS);
    }

    /// Remove a project from the recent list
    pub fn remove(&mut self, path: &str) {
        self.projects.retain(|p| p.path != path);
    }

    /// Clear all recent projects
    pub fn clear(&mut self) {
        self.projects.clear();
    }

    /// Update the path and/or name of a recent project entry
    /// Used when renaming a project (file is renamed on disk)
    pub fn update_project(&mut self, old_path: &str, new_path: String, new_name: String) {
        if let Some(project) = self.projects.iter_mut().find(|p| p.path == old_path) {
            project.path = new_path;
            project.name = new_name;
        }
    }

    /// Get the path to the recent projects file
    fn get_recent_file_path() -> Result<PathBuf, String> {
        // Get platform-specific app data directory
        let app_data_dir = if cfg!(target_os = "windows") {
            std::env::var("APPDATA")
                .map(PathBuf::from)
                .map_err(|_| "APPDATA environment variable not found".to_string())?
        } else if cfg!(target_os = "macos") {
            dirs::home_dir()
                .ok_or_else(|| "Home directory not found".to_string())?
                .join("Library")
                .join("Application Support")
        } else {
            // Linux/Unix
            std::env::var("XDG_CONFIG_HOME")
                .map(PathBuf::from)
                .unwrap_or_else(|_| {
                    dirs::home_dir()
                        .expect("Home directory not found")
                        .join(".config")
                })
        };

        Ok(app_data_dir.join("plc-ide").join(RECENT_FILE_NAME))
    }
}

#[cfg(test)]
#[path = "recent_tests.rs"]
mod recent_tests;
