import { NextResponse } from 'next/server';
import { User, SecurityIncident } from '@/lib/models';
import { secureRoute } from '@/lib/rbac';
import { withLoginRateLimit } from '@/lib/rateLimiter';

async function handler(request) {
    try {
        console.log('[DEBUG] Login Request Received');
        const { email, password } = await request.json();
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        console.log(`[DEBUG] Attempting login for: ${email} from IP: ${ip}`);

        // 1. ELITE RATE LIMITING (IP + Email)
        const rateLimitResponse = await withLoginRateLimit(async () => {
            console.log('[DEBUG] Inside Rate Limit Handler');
            const user = await User.findOne({ email }).select('+password').populate('role');

            if (!user) {
                console.warn(`[DEBUG] User not found: ${email}`);
                return { error: 'Invalid credentials', status: 401 };
            }
            console.log(`[DEBUG] User found: ${user._id} with role: ${user.role?.name}`);

            // 2. BRUTE FORCE PROTECTION: Account Lockout
            if (user.lockUntil && user.lockUntil > Date.now()) {
                return {
                    error: 'Account temporarily locked. Try again in 15 minutes.',
                    status: 403
                };
            }

            if (!(await user.comparePassword(password, user.password))) {
                console.warn(`[DEBUG] Password mismatch for: ${email}`);
                user.failedLoginAttempts += 1;
                if (user.failedLoginAttempts >= 5) {
                    user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
                    await SecurityIncident.create({
                        userId: user._id,
                        type: 'ACCOUNT_LOCKOUT',
                        severity: 'MEDIUM',
                        metadata: { email, attempts: user.failedLoginAttempts, ipAddress: ip }
                    });
                }
                await user.save();
                return { error: 'Invalid credentials', status: 401 };
            }

            if (!user.isActive) {
                console.warn(`[DEBUG] Account deactivated for: ${email}`);
                return { error: 'Account is deactivated', status: 403 };
            }

            // Reset lockout on success
            user.failedLoginAttempts = 0;
            user.lockUntil = undefined;
            await user.save();

            console.log(`[DEBUG] Authentication Successful for: ${email}`);
            return { success: true, user };
        }, { email, ip });

        if (rateLimitResponse instanceof NextResponse) {
            console.warn('[DEBUG] Rate Limit Exceeded Response');
            return rateLimitResponse;
        }

        if (rateLimitResponse.error) {
            console.warn(`[DEBUG] returning error: ${rateLimitResponse.error}`);
            return NextResponse.json({ error: rateLimitResponse.error }, { status: rateLimitResponse.status });
        }

        console.log('[DEBUG] Generating Tokens...');
        const { user } = rateLimitResponse;

        const {
            hashToken,
            generateAccessToken,
            generateRefreshToken,
            setAuthCookies,
            generateCsrfToken
        } = await import('@/lib/auth');

        // 3. GENERATE TOKENS & CSRF
        const payload = {
            userId: user._id,
            roleId: user.role._id,
            organizationId: user.organization,
            tokenVersion: user.tokenVersion,
        };

        const accessToken = generateAccessToken(payload);
        const { token: refreshTokenString, jti } = generateRefreshToken({ userId: user._id.toString() });
        const refreshTokenHash = hashToken(refreshTokenString);
        const csrfToken = generateCsrfToken();

        // 4. PERSIST SESSION WITH METADATA
        const { RefreshToken } = await import('@/lib/models');
        await RefreshToken.create({
            userId: user._id,
            tokenHash: refreshTokenHash,
            jti,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            lastUsedAt: new Date(),
            metadata: {
                userAgent: request.headers.get('user-agent'),
                ipAddress: ip,
                // Device fingerprinting could be added here if sent from client
            }
        });

        await setAuthCookies(accessToken, refreshTokenString);

        return NextResponse.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role.name,
                permissions: user.role.permissions,
                organizationId: user.organization,
            },
            csrfToken // Elite: Required for state-changing requests
        });
    } catch (error) {
        console.error('[CRITICAL_LOGIN_ERROR]:', error);
        return NextResponse.json({
            error: `Authentication engine error: ${error.message}`,
            details: error.stack?.substring(0, 100)
        }, { status: 500 });
    }
}

export const POST = secureRoute(handler, {
    requireAuth: false,
    rateLimit: false, // We use custom withLoginRateLimit instead
    auditAction: 'LOGIN'
});
