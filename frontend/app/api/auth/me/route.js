import { NextResponse } from 'next/server';
import { secureRoute } from '@/lib/rbac';

async function handler(request, { authContext }) {
    // secureRoute already populates authContext with user, permissions, etc.
    const { user, permissions, organizationId } = authContext;

    return NextResponse.json({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role.name,
            permissions,
            organizationId,
        }
    });
}

export const GET = secureRoute(handler, {
    requireAuth: true,
    rateLimit: true,
    auditAction: 'ME_CHECK'
});
