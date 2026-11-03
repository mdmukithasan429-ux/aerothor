import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Strictly validates the submitted password against Vercel environment variables
 * with zero hardcoded fallback strings.
 */
export function validateAdminPassword(submittedPassword: string): boolean {
  const candidate = String(submittedPassword || '').trim();
  if (!candidate) return false;

  const configuredSecurePassword = (process.env.ADMIN_SECURE_PASSWORD || '').trim();
  const configuredAdminPassword = (process.env.ADMIN_PASSWORD || '').trim();
  const configuredSecretKey = (process.env.ADMIN_SECRET_KEY || '').trim();

  if (configuredSecurePassword && candidate === configuredSecurePassword) {
    return true;
  }
  if (configuredAdminPassword && candidate === configuredAdminPassword) {
    return true;
  }
  if (configuredSecretKey && candidate === configuredSecretKey) {
    return true;
  }

  return false;
}

/**
 * Next.js App Router Admin Authentication Route
 * Endpoint: POST /api/admin/auth
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const reqEmail = String(body.email || body.reqEmail || '').trim();
    const reqPassword = String(body.password || body.secretKey || body.reqPassword || '').trim();

    const configuredSecurePassword = (process.env.ADMIN_SECURE_PASSWORD || '').trim();
    const configuredAdminPassword = (process.env.ADMIN_PASSWORD || '').trim();
    const configuredSecretKey = (process.env.ADMIN_SECRET_KEY || '').trim();
    const configuredAdminEmail = (process.env.ADMIN_EMAIL || '').trim();

    if (!configuredSecurePassword && !configuredAdminPassword && !configuredSecretKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Server configuration error: ADMIN_SECURE_PASSWORD environment variable is not configured.',
        },
        { status: 500 }
      );
    }

    const isEmailValid =
      !configuredAdminEmail ||
      !reqEmail ||
      reqEmail.toLowerCase() === configuredAdminEmail.toLowerCase();

    const isPasswordValid = validateAdminPassword(reqPassword);

    if (!isEmailValid || !isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid administrator credentials. Access denied.',
        },
        { status: 401 }
      );
    }

    const sessionToken =
      configuredSecretKey || configuredSecurePassword || configuredAdminPassword;

    const response = NextResponse.json(
      {
        success: true,
        token: sessionToken,
        email: reqEmail || configuredAdminEmail,
        message: 'Admin session authenticated successfully.',
      },
      { status: 200 }
    );

    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Authentication error',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : req.cookies.get('admin_session')?.value || '';

  if (!validateAdminPassword(token)) {
    return NextResponse.json({ authenticated: false, error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, success: true }, { status: 200 });
}
