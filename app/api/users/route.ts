import { sql } from '@/lib/database';
import { validateEmail, sanitizeString } from '@/lib/security/input-validation';
import { apiLimiter } from '@/lib/security/rate-limit';
import { hashPassword } from '@/lib/security/password-hash';
import { NextRequest, NextResponse } from 'next/server';

function getRoleFromRequest(request: NextRequest): string | null {
  return request.headers.get('X-User-Role') || null;
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitCheck = apiLimiter.check(`users:get:${ip}`);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const role = getRoleFromRequest(request);

    if (!['Administrator', 'Manager'].includes(role || '')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const users = await sql`
      SELECT u.id, u.email, u.first_name, u.last_name, r.name AS role, u.active, u.created_at 
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.active = true
      ORDER BY u.created_at DESC
    `;

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('[Users GET Error]', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitCheck = apiLimiter.check(`users:post:${ip}`);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const role = getRoleFromRequest(request);

    if (role !== 'Manager') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: only managers can create users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, firstName, lastName, userRole, password } = body;

    if (!validateEmail(email) || !password || !firstName || !lastName || !userRole) {
      return NextResponse.json(
        { success: false, message: 'Invalid input data' },
        { status: 400 }
      );
    }

    const roleMap: { [key: string]: number } = {
      'Administrator': 1,
      'Manager': 2,
      'ADM_INV': 3
    };

    const roleId = roleMap[userRole];
    if (!roleId) {
      return NextResponse.json(
        { success: false, message: 'Invalid role' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();
    const existing = await sql`
      SELECT id FROM users WHERE LOWER(email) = ${emailLower}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'User already exists' },
        { status: 409 }
      );
    }

    const hash = await hashPassword(password);
    const firstNameSafe = sanitizeString(firstName);
    const lastNameSafe = sanitizeString(lastName);

    const result = await sql`
      INSERT INTO users (email, first_name, last_name, role_id, password_hash, active)
      VALUES (${emailLower}, ${firstNameSafe}, ${lastNameSafe}, ${roleId}, ${hash}, true)
      RETURNING id, email, first_name, last_name, role_id, active
    `;

    return NextResponse.json(
      { success: true, message: 'User created successfully', user: result[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Users POST Error]', error);
    return NextResponse.json(
      { success: false, message: 'Error creating user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitCheck = apiLimiter.check(`users:put:${ip}`);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const role = getRoleFromRequest(request);

    if (role !== 'Manager') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: only managers can edit users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, email, firstName, lastName, password } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID required' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (email) {
      if (!validateEmail(email)) {
        return NextResponse.json(
          { success: false, message: 'Invalid email' },
          { status: 400 }
        );
      }
      updates.push(`email = $${paramCount}`);
      values.push(email.toLowerCase());
      paramCount++;
    }

    if (firstName) {
      updates.push(`first_name = $${paramCount}`);
      values.push(sanitizeString(firstName));
      paramCount++;
    }

    if (lastName) {
      updates.push(`last_name = $${paramCount}`);
      values.push(sanitizeString(lastName));
      paramCount++;
    }

    if (password) {
      const hash = await hashPassword(password);
      updates.push(`password_hash = $${paramCount}`);
      values.push(hash);
      paramCount++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(id);

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, role_id, active
    `;

    const result = await sql.query(updateQuery, values);

    return NextResponse.json(
      { success: true, message: 'User updated successfully', user: result[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Users PUT Error]', error);
    return NextResponse.json(
      { success: false, message: 'Error updating user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitCheck = apiLimiter.check(`users:delete:${ip}`);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const role = getRoleFromRequest(request);

    if (role !== 'Manager') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: only managers can delete users' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID required' },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    const result = await sql`
      DELETE FROM users
      WHERE id = ${userId}
      RETURNING id, email
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Users DELETE Error]', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting user' },
      { status: 500 }
    );
  }
}
