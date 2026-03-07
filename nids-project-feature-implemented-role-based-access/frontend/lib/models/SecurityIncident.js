import mongoose from 'mongoose';

const SecurityIncidentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
    },
    type: {
        type: String,
        required: true,
        enum: [
            'BRUTE_FORCE',
            'BRUTE_FORCE_ATTEMPT',
            'CSRF_VALIDATION_FAILURE',
            'REFRESH_TOKEN_REUSE',
            'SUSPICIOUS_SESSION_ROAMING',
            'PRIVILEGE_ESCALATION_ATTEMPT',
            'ACCESS_DENIED_SPIKE',
            'ACCOUNT_LOCKOUT'
        ],
    },
    severity: {
        type: String,
        required: true,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    status: {
        type: String,
        enum: ['OPEN', 'INVESTIGATING', 'RESOLVED'],
        default: 'OPEN',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

let SecurityIncident;
try {
    SecurityIncident = mongoose.model('SecurityIncident');
} catch (e) {
    SecurityIncident = mongoose.model('SecurityIncident', SecurityIncidentSchema);
}
export default SecurityIncident;
