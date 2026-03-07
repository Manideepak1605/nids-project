import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken, SecurityIncident } from '@/lib/models';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret';

/**
 * Hash utility for tokens
 */
export const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateAccessToken = (payload) => {
    const jti = uuidv4();
    // Payload should include: userId, organizationId, roleId, tokenVersion
    return jwt.sign({ ...payload, jti }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (payload) => {
    const jti = uuidv4();
    // Payload should include: userId
    const token = jwt.sign({ ...payload, jti }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { token, jti };
};

export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (error) {
        return null;
    }
};

export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, REFRESH_TOKEN_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Elite CSRF Protection Utilities
 */
export const generateCsrfToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

export const verifyCsrfToken = (incomingToken, storedToken) => {
    if (!incomingToken || !storedToken) return false;
    return crypto.timingSafeEqual(
        Buffer.from(incomingToken),
        Buffer.from(storedToken)
    );
};

/**
 * Hardened Cookie Strategy (Elite 9.8)
 */
export const setAuthCookies = async (accessToken, refreshToken) => {
    const cookieStore = await cookies();

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    };

    cookieStore.set('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60, // 15 minutes
    });

    cookieStore.set('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });
};

export const clearAuthCookies = async () => {
    const cookieStore = await cookies();
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');
};

/**
 * Elite Refresh Token Rotation & Reuse Detection (Harden with Inactivity)
 */
export const rotateRefreshToken = async (oldTokenString, userId, metadata = {}) => {
    const decoded = verifyRefreshToken(oldTokenString);
    if (!decoded) return null;

    const incomingHash = hashToken(oldTokenString);
    const existingToken = await RefreshToken.findOne({
        tokenHash: incomingHash,
        userId,
        jti: decoded.jti
    });

    // 1. REUSE DETECTION & INACTIVITY CHECK
    if (!existingToken || !existingToken.isActive) {
        const reason = !existingToken ? 'Missing Token' : (existingToken.isInactive ? 'Inactivity' : 'Revoked/Expired');
        console.error(`[SECURITY ALERT] Refresh token denial (${reason}) for user ${userId}`);

        // If it was a reuse attempt (not just inactivity/expiry), revoke ALL
        if (existingToken && !existingToken.isInactive && !existingToken.isExpired) {
            await RefreshToken.updateMany(
                { userId },
                { revokedAt: new Date(), isGlobalRevoked: true }
            );

            await SecurityIncident.create({
                userId,
                type: 'REFRESH_TOKEN_REUSE',
                severity: 'CRITICAL',
                metadata: {
                    jti: decoded.jti,
                    ipAddress: metadata.ipAddress,
                    userAgent: metadata.userAgent,
                    note: 'Automatic global session revocation triggered due to reuse attempt.'
                }
            });
        }

        return null;
    }

    // 2. DETECT SESSION HIJACKING (IP/Device mismatch)
    if (existingToken.metadata.ipAddress !== metadata.ipAddress ||
        existingToken.metadata.userAgent !== metadata.userAgent) {

        await SecurityIncident.create({
            userId,
            type: 'SUSPICIOUS_SESSION_ROAMING',
            severity: 'HIGH',
            metadata: {
                oldIp: existingToken.metadata.ipAddress,
                newIp: metadata.ipAddress,
                oldUA: existingToken.metadata.userAgent,
                newUA: metadata.userAgent,
                note: 'Refresh attempt from different IP or User Agent.'
            }
        });
        // We allow it for now but log it. In higher security, we might force re-auth.
    }

    // Revoke old token
    existingToken.revokedAt = new Date();

    // Generate new session (Zero-Trust: new JTI)
    const { token: newTokenString, jti: newJti } = generateRefreshToken({ userId: userId.toString() });
    const newTokenHash = hashToken(newTokenString);

    existingToken.replacedByTokenHash = newTokenHash;
    await existingToken.save();

    // Create new entry
    const newToken = await RefreshToken.create({
        userId,
        tokenHash: newTokenHash,
        jti: newJti,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(),
        metadata
    });

    return { token: newTokenString, jti: newJti };
};

export const revokeAllSessions = async (userId) => {
    await RefreshToken.updateMany({ userId }, { revokedAt: new Date(), isGlobalRevoked: true });
};
