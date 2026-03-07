import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    tokenHash: {
        type: String,
        required: true,
        unique: true,
    },
    jti: {
        type: String,
        required: true,
        unique: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    revokedAt: {
        type: Date,
    },
    replacedByTokenHash: {
        type: String,
    },
    lastUsedAt: {
        type: Date,
        default: Date.now,
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        location: String,
        deviceFingerprint: String,
    },
    isGlobalRevoked: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

RefreshTokenSchema.virtual('isExpired').get(function () {
    return Date.now() >= this.expiresAt;
});

RefreshTokenSchema.virtual('isInactive').get(function () {
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
    return (Date.now() - this.lastUsedAt.getTime()) > INACTIVITY_LIMIT;
});

RefreshTokenSchema.virtual('isActive').get(function () {
    return !this.revokedAt && !this.isExpired && !this.isGlobalRevoked && !this.isInactive;
});

let RefreshToken;
try {
    RefreshToken = mongoose.model('RefreshToken');
} catch (e) {
    RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);
}
export default RefreshToken;
