import { NextResponse } from 'next/server';
import { secureRoute } from '@/lib/rbac';
import { getSecurityStats } from '@/lib/services/security';

async function handler(request, { authContext }) {
    const stats = await getSecurityStats(authContext.organizationId);
    return NextResponse.json({ stats });
}

export const GET = secureRoute(handler, {
    permission: 'access_audit_logs',
    auditAction: 'VIEW_SECURITY_STATS'
});
