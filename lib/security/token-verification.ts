import { NextRequest } from 'next/server';

/**
 * Token Verification Module - OWASP A06:2021 - Vulnerable and Outdated Components
 * Verifies session tokens and user permissions
 */

export interface TokenPayload {
  sessionToken: string;
  userRole: string;
  userEmail: string;
  timestamp: number;
}

export function verifyTokenFromRequest(request: NextRequest): {
  valid: boolean;
  token?: string;
  role?: string;
  error?: string;
} {
  try {
    // Get Bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        valid: false,
        error: 'Missing or invalid Authorization header'
      };
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    
    // Verify token format (should be 64 hex chars from crypto.randomBytes(32).toString('hex'))
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return {
        valid: false,
        error: 'Invalid token format'
      };
    }

    // Get role from X-User-Role header (should come from trusted client session)
    const role = request.headers.get('X-User-Role');
    if (!role) {
      return {
        valid: false,
        error: 'Missing X-User-Role header'
      };
    }

    // Validate role value (OWASP A01 - Broken Access Control)
    const validRoles = ['Administrator', 'Manager', 'ADM_INV'];
    if (!validRoles.includes(role)) {
      return {
        valid: false,
        error: `Invalid role: ${role}`
      };
    }

    return {
      valid: true,
      token,
      role
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Token verification failed'
    };
  }
}

/**
 * Check if role has permission for action
 * OWASP A01:2021 - Broken Access Control
 */
export function hasPermission(
  role: string,
  action: 'create_product' | 'edit_product' | 'delete_product' | 'manage_users'
): boolean {
  const permissions: Record<string, string[]> = {
    'Administrator': ['create_product', 'edit_product', 'delete_product', 'manage_users'],
    'Manager': ['create_product', 'edit_product', 'manage_users'],
    'ADM_INV': ['create_product', 'edit_product'],
  };

  return (permissions[role] || []).includes(action);
}

/**
 * Format debug info for logging (without exposing sensitive data)
 */
export function formatTokenDebugInfo(request: NextRequest): string {
  const token = request.headers.get('Authorization')?.slice(7);
  const role = request.headers.get('X-User-Role');
  
  return `[TOKEN: ${token ? token.slice(0, 8) + '...' : 'missing'}] [ROLE: ${role || 'missing'}]`;
}
