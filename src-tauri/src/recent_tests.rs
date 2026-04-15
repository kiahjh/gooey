use super::*;

#[test]
fn test_add_recent_project() {
    let mut recent = RecentProjects::new();

    recent.add("/path/to/project1.json".to_string(), "Project1".to_string());
    assert_eq!(recent.projects.len(), 1);
    assert_eq!(recent.projects[0].name, "Project1");

    recent.add("/path/to/project2.json".to_string(), "Project2".to_string());
    assert_eq!(recent.projects.len(), 2);
    assert_eq!(recent.projects[0].name, "Project2"); // Most recent first
}

#[test]
fn test_add_existing_project_updates_timestamp() {
    let mut recent = RecentProjects::new();

    recent.add("/path/to/project1.json".to_string(), "Project1".to_string());
    recent.add("/path/to/project2.json".to_string(), "Project2".to_string());

    // Add project1 again - should move to front
    recent.add("/path/to/project1.json".to_string(), "Project1".to_string());

    assert_eq!(recent.projects.len(), 2);
    assert_eq!(recent.projects[0].path, "/path/to/project1.json");
}

#[test]
fn test_max_recent_projects() {
    let mut recent = RecentProjects::new();

    // Add more than MAX_RECENT_PROJECTS
    for i in 0..15 {
        recent.add(
            format!("/path/to/project{}.json", i),
            format!("Project{}", i),
        );
    }

    assert_eq!(recent.projects.len(), MAX_RECENT_PROJECTS);
}

#[test]
fn test_remove_project() {
    let mut recent = RecentProjects::new();

    recent.add("/path/to/project1.json".to_string(), "Project1".to_string());
    recent.add("/path/to/project2.json".to_string(), "Project2".to_string());

    recent.remove("/path/to/project1.json");

    assert_eq!(recent.projects.len(), 1);
    assert_eq!(recent.projects[0].name, "Project2");
}

#[test]
fn test_serialization() {
    let mut recent = RecentProjects::new();
    recent.add("/path/to/project1.json".to_string(), "Project1".to_string());

    let json = serde_json::to_string(&recent).expect("Failed to serialize");
    let deserialized: RecentProjects = serde_json::from_str(&json).expect("Failed to deserialize");

    assert_eq!(recent.projects.len(), deserialized.projects.len());
    assert_eq!(recent.projects[0].name, deserialized.projects[0].name);
}
