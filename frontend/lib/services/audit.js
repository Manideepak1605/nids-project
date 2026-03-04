import { AuditLog } from '../models';
import dbConnect from '../db';

export async function logAction({ userId, organizationId, action, resource, metadata = {}, ipAddress }) {
    try {
        await dbConnect();
        const log = new AuditLog({
            user: userId,
            organization: organizationId,
            action,
            resource,
            metadata,
            ipAddress,
        });

        // We don't await this to avoid blocking the main request flow
        log.save().catch(err => console.error('Audit Log Error:', err));

        return true;
    } catch (error) {
        console.error('Audit Log Service Error:', error);
        return false;
    }
}
