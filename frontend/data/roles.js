export const rolesInfo = {
    currentUser: "Admin",
    roles: ["Admin", "Analyst", "User"],
    permissions: {
        "Admin": ["view_dashboard", "manage_alerts", "manage_roles", "view_forensics", "export_data"],
        "Analyst": ["view_dashboard", "manage_alerts", "view_forensics"],
        "User": ["view_dashboard"]
    }
};

export const permissionMatrix = [
    { module: "Dashboard", admin: true, analyst: true, user: true },
    { module: "Alerts", admin: true, analyst: true, user: false },
    { module: "XAI", admin: true, analyst: true, user: false },
    { module: "Forensics", admin: true, analyst: true, user: false },
    { module: "Settings", admin: true, analyst: false, user: false },
    { module: "User Management", admin: true, analyst: false, user: false }
];
