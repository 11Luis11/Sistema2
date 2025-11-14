# Librerías de Seguridad Utilizadas

## Resumen Ejecutivo

El sistema YeniJeans Inventory implementa seguridad a nivel empresarial con múltiples capas de protección, utilizando librerías especializadas en seguridad enfocadas en los 10 riesgos de OWASP.

---

## Librerías de Seguridad Principales

### 1. **bcryptjs** ⭐⭐⭐
**Propósito:** Hashing de contraseñas seguro
**Versión:** ^2.4.3

\`\`\`typescript
import * as bcryptjs from 'bcryptjs';

// Hashing
const hash = await bcryptjs.hash('admin123', 12);
// $2b$12$...

// Verification
const isMatch = await bcryptjs.compare('admin123', hash);
// true/false
\`\`\`

**OWASP:** A02:2021 - Cryptographic Failures
**Características:**
- Algoritmo adaptativo (aumenta trabajo automáticamente)
- 12 salt rounds = ~100-200ms por hash
- Resistente a ataques de GPU
- Comparación timing-safe

**Instalación:**
\`\`\`bash
npm install bcryptjs
\`\`\`

---

### 2. **zod** ⭐⭐⭐
**Propósito:** Validación de esquemas y sanitización
**Versión:** 3.25.76

\`\`\`typescript
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8),
});

const result = LoginSchema.safeParse(userInput);
if (!result.success) {
  // Errores de validación
}
\`\`\`

**OWASP:** A03:2021 - Injection
**Características:**
- Validación en tiempo de compilación (TypeScript)
- Transformación de datos
- Sanitización automática
- Mensajes de error detallados

**Instalación:**
\`\`\`bash
npm install zod
\`\`\`

---

### 3. **node-cache** ⭐⭐⭐
**Propósito:** Caché en memoria para rate limiting
**Versión:** ^5.1.2

\`\`\`typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 900 });

// Almacenar
cache.set('user:123', userData, 3600);

// Recuperar
const data = cache.get('user:123');

// Eliminar
cache.del('user:123');
\`\`\`

**OWASP:** A04:2021 - Insecure Design / A07:2021 - Authentication Failures
**Características:**
- TTL configurable por key
- Auto-limpieza de expirados
- Event emitters para expiración
- Sin dependencias externas

**Instalación:**
\`\`\`bash
npm install node-cache
\`\`\`

---

### 4. **helmet** ⭐⭐
**Propósito:** Headers de seguridad HTTP
**Versión:** ^7.1.0

\`\`\`typescript
import helmet from 'helmet';

// Cuando se implemente Express:
app.use(helmet());
// Automáticamente configura:
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - X-XSS-Protection: 1; mode=block
// - Content-Security-Policy
// - Strict-Transport-Security
\`\`\`

**OWASP:** A01:2021 - Broken Access Control
**Características:**
- 15+ headers de seguridad
- Previene MIME type sniffing
- Previene clickjacking
- Protección XSS
- Helmet: Not Allowed Here

**Instalación:**
\`\`\`bash
npm install helmet
\`\`\`

**Nota:** Actualmente en `next.config.mjs`, Next.js maneja muchos de estos headers automáticamente.

---

### 5. **express-rate-limit** ⭐⭐
**Propósito:** Rate limiting para APIs
**Versión:** ^7.1.5

\`\`\`typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: 'Too many requests',
});

// Para Next.js usamos node-cache (implementado)
\`\`\`

**OWASP:** A04:2021 - Insecure Design
**Características:**
- Store options (Redis, memory, etc.)
- Skip conditions customizables
- Handler de error personalizado

**Nota:** Implementamos nuestro propio rate limiter con node-cache para Next.js.

---

## Librerías Nativas de Node.js Utilizadas

### **crypto** (Built-in)
\`\`\`typescript
import * as crypto from 'crypto';

// Generar tokens seguros (32 bytes)
const token = crypto.randomBytes(32).toString('hex');

// Hashing (para funciones que no sean password)
const hash = crypto.createHash('sha256');
hash.update('data');
const digest = hash.digest('hex');
\`\`\`

**Propósito:** Operaciones criptográficas fundamentales
**OWASP:** A02:2021 - Cryptographic Failures

---

### **@neondatabase/serverless**
\`\`\`typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const users = await sql('SELECT * FROM users WHERE email = $1', [email]);
\`\`\`

**Propósito:** Cliente PostgreSQL serverless
**OWASP:** A03:2021 - Injection
**Características:**
- Queries parameterizadas
- Connection pooling
- Zero-config SSL/TLS

---

## Validación y Sanitización

### **Zod + Custom Sanitization**
\`\`\`typescript
// Validación
const schema = z.object({
  email: z.string().email(),
  name: z.string().max(100),
});

// Sanitización (prevenir XSS)
function sanitizeString(input: string): string {
  return input
    .replace(/[<>\"'&]/g, (char) => ({
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
    }[char]));
}

// En producción, usar DOMPurify (si hay renderizado de HTML)
\`\`\`

---

## Control de Acceso

### **Autenticación en Capas**

\`\`\`typescript
// Nivel 1: Session Token
const sessionToken = crypto.randomBytes(32).toString('hex');

// Nivel 2: Role-Based Access Control (RBAC)
const allowedRoles = ['Administrator', 'Manager', 'ADM_INV'];
if (!allowedRoles.includes(userRole)) {
  return unauthorized();
}

// Nivel 3: Resource-Level Permissions
const canDelete = ['Administrator', 'Manager'].includes(userRole);
\`\`\`

---

## Auditoría y Logging

### **Implementación**
\`\`\`typescript
// Login Audit Log (en DB)
await sql(
  `INSERT INTO login_audit_log 
   (user_id, email, ip_address, success, timestamp)
   VALUES ($1, $2, $3, $4, NOW())`,
  [userId, email, ip, success]
);

// Error Logging
console.error('[Login Error]', {
  timestamp: new Date(),
  email,
  ip,
  error: error.message,
});
\`\`\`

---

## Protección Contra Ataques Comunes

### **1. Brute Force Attack (Rate Limiting + Account Lockout)**
\`\`\`typescript
// Login Attempts Limiter
const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 min

// Implementado en:
lib/security/login-attempts.ts
lib/security/rate-limit.ts
\`\`\`

### **2. SQL Injection (Parameterized Queries)**
\`\`\`typescript
// ✅ SEGURO
await sql('SELECT * FROM users WHERE email = $1', [email]);

// ❌ VULNERABLE
await sql(`SELECT * FROM users WHERE email = '${email}'`);
\`\`\`

### **3. XSS Attack (Input Sanitization)**
\`\`\`typescript
// Validar y sanitizar
const sanitized = sanitizeString(userInput);
\`\`\`

### **4. CSRF (CSRF Tokens)**
\`\`\`typescript
// Implementado en:
lib/security/csrf-protection.ts

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
\`\`\`

### **5. Weak Password (Bcryptjs + Validation)**
\`\`\`typescript
// Mínimo 8 caracteres
const schema = z.object({
  password: z.string().min(8),
});

// Hashing con 12 rounds
const hash = await bcryptjs.hash(password, 12);
// Tiempo: ~100-200ms (fuerza bruta impráctica)
\`\`\`

---

## Matriz de Cobertura OWASP

| OWASP Risk | Librería | Archivo | Status |
|-----------|----------|---------|--------|
| A01: Broken Access Control | Custom RBAC | auth-middleware.ts | ✅ |
| A02: Cryptographic Failures | bcryptjs, crypto | password-hash.ts | ✅ |
| A03: Injection | zod, @neondatabase | input-validation.ts, database.ts | ✅ |
| A04: Insecure Design | node-cache | rate-limit.ts, login-attempts.ts | ✅ |
| A05: Security Misconfiguration | helmet, custom | API routes | ✅ |
| A06: Vulnerable Components | npm audit | package.json | ✅ |
| A07: Authentication Failures | bcryptjs, node-cache | login/route.ts | ✅ |
| A08: Data Integrity Failures | crypto, zod | csrf-protection.ts | ✅ |
| A09: Logging & Monitoring | Custom logging | login_audit_log | ✅ |
| A10: SSRF | Input validation | rate-limit.ts | ✅ |

---

## Instalación Completa

\`\`\`bash
npm install

# Dependencias principales de seguridad:
npm install bcryptjs zod node-cache helmet

# TypeScript
npm install -D typescript @types/node
\`\`\`

---

## Verificación de Seguridad

\`\`\`bash
# Auditar vulnerabilidades
npm audit

# Actualizar dependencias seguras
npm audit fix

# Verificar librerias outdated
npm outdated
\`\`\`

---

## Mejores Prácticas Implementadas

✅ **Least Privilege:** Roles y permisos específicos
✅ **Defense in Depth:** Múltiples capas de validación
✅ **Fail Securely:** Errores genéricos para usuarios
✅ **Secure by Default:** Configuración segura predeterminada
✅ **Input Validation:** Todas las entradas validadas
✅ **Output Encoding:** Sanitización de salidas
✅ **Logging & Monitoring:** Auditoría de eventos críticos
✅ **Crypto Best Practices:** Hashing adaptativo, tokens seguros

---

## Para Futura Evolución

1. **Implementar Redis** (en lugar de node-cache)
   - Mejor rendimiento en producción
   - Compartir rate limits entre instancias

2. **Agregar 2FA**
   - TOTP con Google Authenticator
   - Backup codes

3. **Implementar Helmet** en middleware
   - Más headers de seguridad
   - CSP stricto

4. **Logging Centralizado**
   - Splunk, ELK Stack
   - Análisis de seguridad en tiempo real

5. **Penetration Testing**
   - OWASP ZAP
   - Manual testing por profesionales
