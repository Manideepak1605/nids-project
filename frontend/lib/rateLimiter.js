import { NextResponse } from 'next/server';

const rateLimitMap = new Map();

/**
 * Role-Based Rate Limiting
 * Super Admin: 100 requests per 60s
 * Security Analyst: 50 requests per 60s
 * Default: 10 requests per 60s
 */
const LIMITS = {
    developer: 150, // Higher threshold for devs
    super_admin: 100,
    security_analyst: 50,
    network_operator: 30,
    auditor: 20,
    guest_viewer: 10,
};

/**
 * Strict Login Endpoint Rate Limiting (9.8+)
 * Limits requests by IP + Email combination.
 */
export async function withLoginRateLimit(handler, { email, ip }) {
    const identifier = `login:${ip}:${email}`;
    const limit = 5; // 5 attempts
    const windowMs = 5 * 60 * 1000; // 5 minutes

    const now = Date.now();
    let limitData = rateLimitMap.get(identifier);

    if (!limitData || (now - limitData.firstRequest > windowMs)) {
        limitData = { count: 1, firstRequest: now };
    } else {
        limitData.count++;
    }

    rateLimitMap.set(identifier, limitData);

    if (limitData.count > limit) {
        console.warn(`[SEC] [RATE_LIMIT] Login flood detected for ${email} from ${ip}`);

        // Log Security Incident dynamically
        const { SecurityIncident } = await import('./models');
        await SecurityIncident.create({
            type: 'BRUTE_FORCE_ATTEMPT',
            severity: 'HIGH',
            metadata: { email, ipAddress: ip, note: 'Login endpoint rate limit exceeded (IP+Email).' }
        });

        return NextResponse.json(
            { error: 'Too many login attempts. Please try again in 5 minutes.' },
            { status: 429, headers: { 'Retry-After': '300' } }
        );
    }

    return handler();
}

export function withRateLimit(handler) {
    return async (request, context = {}) => {
        const user = context?.user;
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

        let limit = 10; // Default guest limit
        let identifier = ip;

        if (user) {
            const roleName = user.role?.name || 'guest';
            limit = LIMITS[roleName] || 10;
            identifier = user._id.toString();
        }

        const now = Date.now();
        const windowMs = 60000;

        let limitData = rateLimitMap.get(identifier);

        if (!limitData) {
            limitData = { count: 1, firstRequest: now };
        } else {
            if (now - limitData.firstRequest > windowMs) {
                limitData = { count: 1, firstRequest: now };
            } else {
                limitData.count++;
            }
        }

        rateLimitMap.set(identifier, limitData);

        if (limitData.count > limit) {
            console.warn(`[SEC] Rate limit exceeded for ${identifier} (${user ? user.role.name : 'guest'})`);
            return NextResponse.json(
                { error: 'Too many requests' },
                { status: 429, headers: { 'Retry-After': '60' } }
            );
        }

        return handler(request, context);
    };
}
