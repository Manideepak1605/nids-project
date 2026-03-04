import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Role from '@/lib/models/Role';
import Organization from '@/lib/models/Organization';

export async function POST() {
    try {
        await dbConnect();

        // Create a default organization if none exists
        let org = await Organization.findOne({ name: 'Default Organization' });
        if (!org) {
            org = await Organization.create({
                name: 'Default Organization',
                subscriptionPlan: 'enterprise',
            });
        }

        const defaultRoles = [
            {
                name: 'super_admin',
                isSystemRole: true,
                permissions: [
                    'view_dashboard', 'view_dashboard_limited', 'view_live_traffic', 'view_alerts',
                    'manage_alerts', 'acknowledge_alerts', 'add_investigation_notes', 'view_logs',
                    'view_all_logs', 'export_reports', 'manage_users', 'manage_roles',
                    'system_settings', 'view_system_health', 'access_audit_logs'
                ],
            },
            {
                name: 'security_analyst',
                isSystemRole: true,
                permissions: [
                    'view_dashboard', 'view_live_traffic', 'view_alerts',
                    'manage_alerts', 'acknowledge_alerts', 'add_investigation_notes',
                    'view_logs', 'export_reports'
                ],
            },
            {
                name: 'network_operator',
                isSystemRole: true,
                permissions: [
                    'view_dashboard', 'view_live_traffic', 'view_alerts',
                    'acknowledge_alerts', 'view_logs'
                ],
            },
            {
                name: 'auditor',
                isSystemRole: true,
                permissions: [
                    'view_dashboard', 'view_logs', 'view_all_logs', 'access_audit_logs', 'export_reports'
                ],
            },
            {
                name: 'developer',
                isSystemRole: true,
                permissions: [
                    'view_dashboard', 'view_dashboard_limited', 'view_live_traffic', 'view_alerts',
                    'manage_alerts', 'acknowledge_alerts', 'add_investigation_notes', 'view_logs',
                    'view_all_logs', 'export_reports', 'manage_users', 'manage_roles',
                    'system_settings', 'view_system_health', 'access_audit_logs', 'developer_override'
                ],
            },
            {
                name: 'guest_viewer',
                isSystemRole: true,
                permissions: ['view_dashboard_limited'],
            },
        ];

        for (const roleData of defaultRoles) {
            await Role.findOneAndUpdate(
                { name: roleData.name, isSystemRole: true },
                roleData,
                { upsert: true, new: true }
            );
        }

        return NextResponse.json({ message: 'Roles seeded successfully' });
    } catch (error) {
        console.error('Seed Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
