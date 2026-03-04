import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    resource: {
        type: String,
        required: true,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    ipAddress: {
        type: String,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

let AuditLog;
try {
    AuditLog = mongoose.model('AuditLog');
} catch (e) {
    AuditLog = mongoose.model('AuditLog', AuditLogSchema);
}
export default AuditLog;
