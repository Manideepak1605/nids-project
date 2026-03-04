import { AuditLog } from '../models';
import dbConnect from '../db';

export async function detectSuspiciousActivity(userId, organizationId, type, metadata = {}) {
    await dbConnect();

    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    // Check for repeated 403s or failed logins
    const recentFailures = await AuditLog.countDocuments({
        user: userId,
        organization: organizationId,
        action: { $in: ['ACCESS_DENIED', 'LOGIN_FAILED'] },
        timestamp: { $gte: tenMinutesAgo }
    });

    if (recentFailures > 10) {
        // Flag suspicious activity
        await AuditLog.create({
            user: userId,
            organization: organizationId,
            action: 'SUSPICIOUS_ACTIVITY_DETECTED',
            resource: 'SECURITY',
            metadata: {
                type,
                failureCount: recentFailures,
                ...metadata
            },
            ipAddress: metadata.ip || 'unknown'
        });

        console.warn(`[SEC] High suspicious activity alert for user ${userId}`);
        return true;
    }

    return false;
}

export async function getSecurityStats(organizationId) {
    await dbConnect();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 1000 * 60);

    const stats = await AuditLog.aggregate([
        {
            $match: {
                organization: organizationId,
                timestamp: { $gte: twentyFourHoursAgo }
            }
        },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 }
            }
        }
    ]);

    return stats;
}
