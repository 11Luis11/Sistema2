import { sql } from '@/lib/database';
import { hashPassword, verifyPassword } from '@/lib/security/password-hash';
import { checkLoginAttempts, recordFailedAttempt, clearLoginAttempts } from '@/lib/security/login-attempts';
import { validateLogin, sanitizeString } from '@/lib/security/input-validation';
import { apiLimiter } from '@/lib/security/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitCheck = apiLimiter.check(`login:${ip}`);
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many login attempts. Please try again later.',
          error_code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }

    const body = await request.json();

    const validation = validateLogin(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input format',
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const attemptCheck = checkLoginAttempts(email);
    if (!attemptCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: attemptCheck.message,
          attemptsLeft: 0,
          error_code: 'ACCOUNT_LOCKED',
        },
        { status: 429 }
      );
    }

    const users = await sql`
      SELECT u.id, u.password_hash, u.email, u.role_id, u.first_name, u.last_name, u.active, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE LOWER(u.email) = LOWER(${email}) AND (u.active = true OR u.active IS NULL)
    `;

    if (users.length === 0) {
      recordFailedAttempt(email);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials',
          attemptsLeft: attemptCheck.attemptsLeft - 1,
          error_code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      );
    }

    const user = users[0];

    const passwordMatch = await verifyPassword(password, user.password_hash);

    if (!passwordMatch) {
      recordFailedAttempt(email);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials',
          attemptsLeft: attemptCheck.attemptsLeft - 1,
          error_code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      );
    }

    clearLoginAttempts(email);

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      await sql`
        INSERT INTO login_audit_log (user_id, email, ip_address, success, timestamp)
        VALUES (${user.id}, ${email}, ${ip}, true, NOW())
      `;
    } catch (auditError) {
      console.error('[Audit Log Error]', auditError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: sanitizeString(user.email),
          firstName: sanitizeString(user.first_name || ''),
          lastName: sanitizeString(user.last_name || ''),
          role: user.role_name || 'USER',
          roleId: user.role_id,
        },
        sessionToken,
        expiresAt: sessionExpiry.toISOString(),
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': `sessionToken=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${24 * 60 * 60}`,
        },
      }
    );
  } catch (error) {
    console.error('[Login Error]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during login',
        error_code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
