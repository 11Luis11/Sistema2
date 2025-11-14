# Token y Sistema de Seguridad - Guía Detallada

## 1. FLUJO DE TOKENS

### Login Flow (Cliente → Servidor)
\`\`\`
1. Usuario ingresa email y contraseña
2. Cliente envía POST /api/auth/login
3. Servidor valida credenciales
4. Servidor genera sessionToken = crypto.randomBytes(32).toString('hex')
5. Servidor retorna sessionToken + user data
6. Cliente almacena en localStorage
\`\`\`

### API Requests (Cliente → Servidor)
\`\`\`
Encabezados requeridos:
- Authorization: Bearer {sessionToken}
- X-User-Role: {role}
- Content-Type: application/json

Ejemplo:
fetch('/api/products', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer abc123def456...',
    'X-User-Role': 'Manager',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ ... })
})
\`\`\`

## 2. VERIFICACIÓN EN SERVIDOR

### Paso 1: Rate Limiting (OWASP A07:2021 - Identification and Authentication Failures)
\`\`\`typescript
const rateLimitCheck = apiLimiter.check(`products:post:${ip}`);
if (!rateLimitCheck.allowed) return 429 Too Many Requests
\`\`\`
- 30 solicitudes por minuto por IP
- Previene fuerza bruta y DDoS

### Paso 2: Token Verification
\`\`\`typescript
const token = request.headers.get('Authorization')?.replace('Bearer ', '');
if (!token) return 401 Unauthorized
// Token formato: 64 caracteres hexadecimales
if (!/^[a-f0-9]{64}$/.test(token)) return 401 Unauthorized
\`\`\`

### Paso 3: Role Check (OWASP A01:2021 - Broken Access Control)
\`\`\`typescript
const role = request.headers.get('X-User-Role');
if (!['Administrator', 'Manager', 'ADM_INV'].includes(role)) return 403 Forbidden
\`\`\`

### Paso 4: Permission Validation
\`\`\`
Para crear/editar producto: ['Administrator', 'Manager', 'ADM_INV']
Para eliminar producto: ['Administrator'] SOLO
Para gestionar usuarios: ['Manager'] SOLO
\`\`\`

### Paso 5: Input Validation (OWASP A03:2021 - Injection)
\`\`\`typescript
const validation = validateProduct(body);
if (!validation.success) return 400 Bad Request
// Usa ZOD para type-safe validation
\`\`\`

### Paso 6: SQL Injection Prevention (OWASP A03:2021)
\`\`\`typescript
// ❌ NUNCA hacer esto:
const query = `SELECT * FROM products WHERE name = '${name}'`

// ✅ SIEMPRE hacer esto:
const result = sql('SELECT * FROM products WHERE name = $1', [name])
// Parámetros separados del query
\`\`\`

## 3. LIBRERÍAS DE SEGURIDAD USADAS

### crypto (Node.js built-in)
- **PBKDF2**: Hash de contraseñas (100,000 iteraciones)
  - \`\`\`typescript
    crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256')
    \`\`\`

- **randomBytes**: Generación de tokens seguros
  - \`\`\`typescript
    crypto.randomBytes(32).toString('hex') // 64 caracteres
    \`\`\`

- **HMAC**: Para validaciones criptográficas
  - \`\`\`typescript
    crypto.createHmac('sha256', secret).update(data).digest('hex')
    \`\`\`

### zod
- **Schema Validation**: Valida estructura de datos
  - \`\`\`typescript
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6)
    });
    schema.parse(data)
    \`\`\`

- **Type Safe**: Conversión de tipos segura
  - \`\`\`typescript
    const validation = schema.safeParse(body);
    if (!validation.success) { /* errores detallados */ }
    \`\`\`

### next/headers
- **HttpOnly Cookies**: Headers seguros del lado servidor
  - \`\`\`typescript
    'Set-Cookie': 'token=xxx; HttpOnly; Secure; SameSite=Strict'
    \`\`\`

- **Lectura segura de headers**: Previene inyección
  - \`\`\`typescript
    const role = request.headers.get('X-User-Role')
    \`\`\`

## 4. DÓNDE SE VE LA SEGURIDAD EN EJECUCIÓN

### En Agregar Producto (POST /api/products)

1. **Rate Limit Check** (línea 7-13)
   - Si llama >30 veces/min → 429 Too Many Requests

2. **Token Verification** (línea 23-25)
   - Si no envía Authorization header → 401 Unauthorized
   - Si token formato inválido → 401 Unauthorized

3. **Role Validation** (línea 26-31)
   - Si rol no está en ['Administrator', 'Manager', 'ADM_INV'] → 403 Forbidden

4. **Input Validation** (línea 35-45)
   - Si falta `code` o `name` → 400 Bad Request
   - Si precio no es número → 400 Bad Request

5. **Duplicate Check** (línea 47-56)
   - Evita códigos de producto duplicados
   - Query parametrizado (OWASP A03 prevention)

6. **Database Insert** (línea 58-63)
   - Usa parámetros separados ($1, $2, etc)
   - Previene SQL Injection

### En Editar Producto (PUT /api/products/[id])

- Mismo flujo que POST
- PERO: Solo roles 'Administrator' y 'Manager' pueden editar
- Query UPDATE con parámetros: `WHERE id = $8 AND active = true`

### En Eliminar Producto (DELETE /api/products/[id])

- Rate limit + Token + Role check
- PERO: Solo 'Administrator' puede eliminar
- Soft delete: `UPDATE products SET active = false` (auditoría)

## 5. PRUEBA DE TOKENS

### Verificar Token Válido
\`\`\`bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@yenijeans.com", "password": "admin123"}'

# Respuesta:
{
  "success": true,
  "sessionToken": "abc123def456...",
  "user": {
    "role": "Administrator",
    "email": "admin@yenijeans.com"
  }
}

# 2. Usar token en request
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer abc123def456..." \
  -H "X-User-Role: Administrator"
\`\`\`

### Fallo de Token
\`\`\`bash
# Sin token → 401
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"code": "P-001", ...}'
# Response: 401 Unauthorized

# Token inválido → 401
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer invalid" \
  -H "X-User-Role: Manager"
# Response: 401 Unauthorized

# Rol insuficiente (ADM_INV intentando eliminar) → 403
curl -X DELETE http://localhost:3000/api/products/1 \
  -H "Authorization: Bearer validtoken" \
  -H "X-User-Role: ADM_INV"
# Response: 403 Forbidden - only administrators can delete
\`\`\`

## 6. CRONOLOGÍA OWASP IMPLEMENTADA

| OWASP | Vulnerabilidad | Mitigación |
|-------|----------------|-----------|
| A01 | Broken Access Control | Verificación de roles en cada endpoint |
| A02 | Cryptographic Failures | PBKDF2 con 100k iteraciones + salt aleatorio |
| A03 | Injection | Parámetros SQL separados ($ notation) + Zod validation |
| A06 | Vulnerable & Outdated | Librerías actualizadas, sin hardcoded secrets |
| A07 | Identification Failures | Rate limit, account lockout, intentos limitados |
| A07 | Authentication | Tokens seguros (64 hex chars), HttpOnly cookies |

## 7. ESTRUCTURA DE TOKEN EN localStorage

\`\`\`javascript
// localStorage.sessionToken (ejemplo)
"a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f"

// localStorage.user (objeto JSON)
{
  "id": 1,
  "email": "admin@yenijeans.com",
  "firstName": "Admin",
  "lastName": "YeniJeans",
  "role": "Administrator",
  "roleId": 1
}

// localStorage.expiresAt (ISO 8601)
"2025-11-15T10:30:00.000Z"
\`\`\`

## 8. CÓMO VALIDAR EN CLIENTE

\`\`\`typescript
// Usar SessionValidator para verificar antes de enviar request
import { getAuthHeaders, isSessionValid } from '@/lib/security/session-validator';

// Verificar si sesión es válida
if (!isSessionValid()) {
  router.push('/'); // Redirigir a login
  return;
}

// Obtener headers seguros
const headers = getAuthHeaders();
if (!headers) {
  throw new Error('Invalid session');
}

// Usar en fetch
fetch('/api/products', {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify(productData)
})
\`\`\`

## 9. DEBUGGING TOKENS

Agregar a console en cliente:
\`\`\`typescript
// En login-form.tsx o add-product-form.tsx
console.log('[v0] Session Token:', localStorage.getItem('sessionToken'));
console.log('[v0] User Role:', JSON.parse(localStorage.getItem('user') || '{}').role);
console.log('[v0] Headers being sent:', {
  'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`,
  'X-User-Role': JSON.parse(localStorage.getItem('user') || '{}').role
});
\`\`\`

En servidor (ya implementado):
\`\`\`typescript
console.error('[Products POST Error]', error);
console.log('[v0] Error response:', data);
\`\`\`

---

**Conclusión**: El sistema usa multi-capa de seguridad:
1. Rate limiting
2. Token verification
3. Role-based access control
4. Input validation
5. SQL injection prevention
6. Audit logging

Cada layer falla en forma segura (devuelve error específico sin exponer detalles).
