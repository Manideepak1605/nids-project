import { NextResponse } from 'next/server';
import { clearAuthCookies, verifyRefreshToken, hashToken } from '@/lib/auth';
import RefreshToken from '@/lib/models/RefreshToken';
import dbConnect from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        await dbConnect();
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get('refreshToken')?.value;

        if (refreshToken) {
            const decoded = verifyRefreshToken(refreshToken);
            if (decoded) {
                const tokenHash = hashToken(refreshToken);
                // Revoke the specific session
                await RefreshToken.findOneAndUpdate(
                    { tokenHash, userId: decoded.userId },
                    { revokedAt: new Date() }
                );
            }
        }

        await clearAuthCookies();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[AUTH_LOGOUT_ERROR]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
