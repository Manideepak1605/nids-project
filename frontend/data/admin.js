export const adminData = {
    users: [
        { id: "USR-001", name: "S. Abhinav", role: "Admin", status: "Active", lastLogin: "2 mins ago", ip: "192.168.1.10" },
        { id: "USR-002", name: "R. Sharma", role: "Analyst", status: "Active", lastLogin: "14 mins ago", ip: "192.168.1.15" },
        { id: "USR-003", name: "K. Verma", role: "User", status: "Inactive", lastLogin: "3 days ago", ip: "192.168.1.22" },
        { id: "USR-004", name: "A. Khan", role: "Analyst", status: "Active", lastLogin: "1 hour ago", ip: "192.168.1.45" },
    ],
    auditLogs: [
        { id: "LOG-992", action: "Policy Update", user: "S. Abhinav", time: "20:55:34", status: "Success" },
        { id: "LOG-991", action: "Report Export", user: "S. Abhinav", time: "20:52:29", status: "Success" },
        { id: "LOG-990", action: "System Scan", user: "SYSTEM", time: "20:45:00", status: "Success" },
        { id: "LOG-989", action: "Auth Failure", user: "UNKNOWN", time: "20:30:12", status: "Blocked" },
    ]
};
