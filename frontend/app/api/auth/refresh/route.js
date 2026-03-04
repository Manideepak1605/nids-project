import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, RefreshToken, SecurityIncident } from '@/lib/models';
import {
    verifyRefreshToken,
    hashToken,
    generateAccessToken,
    rotateRefreshToken,
    setAuthCookies
} from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        await dbConnect();
        const cookieStore = await cookies();
        const oldTokenString = cookieStore.get('refreshToken')?.value;

        if (!oldTokenString) {
            return NextResponse.json({ error: 'Refresh token missing' }, { status: 401 });
        }

        const decoded = verifyRefreshToken(oldTokenString);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
        }

        const user = await User.findOne({ _id: decoded.userId, isActive: true }).populate('role');
        if (!user) {
            return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
        }

        // Rotate Token & Handle Reuse Detection
        const metadata = {
            userAgent: request.headers.get('user-agent'),
            ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        };

        const {
            token: newTokenString,
            jti: newJti
        } = await rotateRefreshToken(oldTokenString, user._id, metadata);

        if (!newTokenString) {
            return NextResponse.json({ error: 'Session expired or security alert' }, { status: 403 });
        }

        // Generate new Access Token
        const payload = {
            userId: user._id,
            roleId: user.role._id,
            organizationId: user.organization,
            tokenVersion: user.tokenVersion,
        };
        const newAccessToken = generateAccessToken(payload);

        // Elite 9.8: Fresh CSRF on refresh
        const { generateCsrfToken } = await import('@/lib/auth');
        const csrfToken = generateCsrfToken();

        // Update Cookies
        await setAuthCookies(newAccessToken, newTokenString);

        return NextResponse.json({ success: true, csrfToken });
    } catch (error) {
        console.error('[AUTH_REFRESH_ERROR]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
