import { NextResponse } from 'next/server';
import { secureRoute, getTenantScopedQuery } from '@/lib/rbac';
import { RefreshToken, User } from '@/lib/models';
import dbConnect from '@/lib/db';
import { revokeAllSessions } from '@/lib/auth';

async function GET_handler(request, { authContext }) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    // ENFORCED: Ensure target user belongs to same organization
    try {
        await getTenantScopedQuery(User, targetUserId, authContext);
    } catch (err) {
        return NextResponse.json({ error: 'Access denied: Target user outside organization' }, { status: 403 });
    }

    const sessions = await RefreshToken.find({
        userId: targetUserId,
        revokedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
        isGlobalRevoked: false
    }).select('-tokenHash');

    return NextResponse.json({ sessions });
}

async function DELETE_handler(request, { authContext }) {
    await dbConnect();
    const { targetUserId, jti, revokeAll, unlock } = await request.json();

    if (!targetUserId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    // ENFORCED: Boundary check for any action
    try {
        const targetUser = await getTenantScopedQuery(User, targetUserId, authContext);
    } catch (err) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (revokeAll) {
        await revokeAllSessions(targetUserId);
        return NextResponse.json({ message: 'All sessions revoked' });
    }

    if (jti) {
        // Double check JTI belongs to user (additional safety)
        await RefreshToken.findOneAndUpdate(
            { jti, userId: targetUserId },
            { revokedAt: new Date() }
        );
        return NextResponse.json({ message: 'Session revoked' });
    }

    if (unlock) {
        await User.findOneAndUpdate(
            { _id: targetUserId, organization: authContext.organizationId },
            { failedLoginAttempts: 0, lockUntil: undefined }
        );
        return NextResponse.json({ message: 'Account unlocked' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export const GET = secureRoute(GET_handler, {
    permission: 'manage_users',
    auditAction: 'VIEW_USER_SESSIONS'
});

export const DELETE = secureRoute(DELETE_handler, {
    permission: 'manage_users',
    auditAction: 'MANAGE_SESSIONS'
});
