import { NextResponse } from 'next/server';
import { secureRoute } from '@/lib/rbac';
import SecurityIncident from '@/lib/models/SecurityIncident';
import dbConnect from '@/lib/db';

async function GET_handler(request, { authContext }) {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');

    let query = {};
    if (authContext.user.role.name !== 'super_admin') {
        query.organizationId = authContext.organizationId;
    }
    if (severity) query.severity = severity;
    if (type) query.type = type;

    const incidents = await SecurityIncident.find(query)
        .sort({ timestamp: -1 })
        .limit(100)
        .populate('userId', 'name email');

    return NextResponse.json({ incidents });
}

async function PATCH_handler(request, { authContext }) {
    await dbConnect();
    const { incidentId, status } = await request.json();

    const incident = await getTenantScopedQuery(SecurityIncident, incidentId, authContext);
    if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    incident.status = status;
    await incident.save();

    return NextResponse.json({ message: 'Incident updated', incident });
}

export const GET = secureRoute(GET_handler, {
    permission: 'access_audit_logs',
    auditAction: 'LIST_INCIDENTS'
});

export const PATCH = secureRoute(PATCH_handler, {
    permission: 'manage_users', // Or specific permission for security
    auditAction: 'UPDATE_INCIDENT'
});
