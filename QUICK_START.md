# YeniJeans Inventory System - Quick Start Guide

## 📦 Requisitos Previos

- Node.js 18+ instalado
- Cuenta en Neon (ya integrada)
- Visual Studio Code instalado

## 🚀 Paso 1: Descargar el Proyecto

### Opción A: Usando Git
\`\`\`bash
git clone <tu-repositorio>
cd inventory-system
\`\`\`

### Opción B: Usando ZIP
1. En v0, haz click en los 3 puntos
2. Selecciona "Download ZIP"
3. Descomprime en tu carpeta de proyectos

---

## 🗄️ Paso 2: Configurar la Base de Datos

### 2.1 Acceder a Neon
1. Ve a [console.neon.tech](https://console.neon.tech)
2. Abre tu proyecto "Inventory system with Neon"
3. Haz click en **SQL Editor**

### 2.2 Ejecutar Script de Creación de BD
1. Abre `scripts/01-init-database.sql` en VS Code
2. Copia TODO el contenido
3. Pega en Neon SQL Editor
4. Haz click **Execute**

**Resultado esperado:**
\`\`\`
✓ Tablas creadas
✓ Roles insertados
✓ Usuarios iniciales creados
\`\`\`

### 2.3 Configurar Contraseña de Admin
En VS Code Terminal, ejecuta:

\`\`\`bash
node scripts/setup-all-users.ts
\`\`\`

Verás algo como:
\`\`\`
✓ admin@yenijeans.com
  Contraseña: admin123
  Hash: $2b$12$...
  
COPY AND PASTE IN NEON SQL EDITOR:
UPDATE users SET password_hash = '$2b$12$...' WHERE email = 'admin@yenijeans.com';
\`\`\`

1. Copia el UPDATE generado
2. Pega en Neon SQL Editor
3. Ejecuta (harás esto 3 veces, una por cada usuario)

---

## 📥 Paso 3: Instalar Dependencias

En terminal VS Code:

\`\`\`bash
npm install
\`\`\`

Espera 2-3 minutos. Verás:
\`\`\`
added 150+ packages
\`\`\`

---

## ✅ Paso 4: Verificar Conexión a Neon

\`\`\`bash
npm run test:db
\`\`\`

**Resultado esperado:**
\`\`\`
=== TESTING NEON DATABASE CONNECTION ===

✅ Connection successful!
Server time: 2024-11-14T15:30:45.123Z

📋 Tables found:
  ✓ users
  ✓ products
  ✓ categories
  ✓ stock_movements
  ✓ login_audit_log

👥 Users registered: 3
📦 Products in inventory: 0

=== ALL TESTS PASSED ===
\`\`\`

Si ves error, verifica que `.env` tenga `DATABASE_URL`:
1. En VS Code, crea archivo `.env` en la raíz
2. Copia tu URL de Neon
3. Agrega:
\`\`\`env
DATABASE_URL=postgresql://[tu-url-aqui]
\`\`\`

---

## ▶️ Paso 5: Ejecutar la Aplicación

\`\`\`bash
npm run dev
\`\`\`

Verás:
\`\`\`
✓ Next.js ready on http://localhost:3000
\`\`\`

---

## 🎯 Paso 6: Acceder al Sistema

1. Abre: **http://localhost:3000**
2. Verás la pantalla de login con logo YeniJeans
3. Ingresa credenciales:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@yenijeans.com | admin123 | Administrator |
| gerente@yenijeans.com | gerente123 | Manager |
| adm_inv@yenijeans.com | adm_inv123 | ADM_INV |

---

## 🧪 Paso 7: Probar Funcionalidades

### Agregar un Producto
1. Haz click en **"Agregar Producto"**
2. Completa el formulario:
   - Código: `PRD-001`
   - Nombre: `Jean Azul Clásico`
   - Categoría: Selecciona una
   - Precio: `50.00`
   - Talla: `M`
   - Color: `Azul`
   - Stock: `20`
3. Haz click en **"Guardar"**
4. Verás el producto en la tabla

### Editar un Producto
1. En la tabla, haz click en el icono de **lápiz**
2. Modifica los datos
3. Guarda los cambios

### Eliminar un Producto (solo Admin/Manager)
1. En la tabla, haz click en el icono de **basura**
2. Confirma eliminación

### Buscar Productos
1. En el buscador superior, escribe parte del nombre o código
2. La tabla se filtra automáticamente

### Cerrar Sesión
1. Haz click en **"Cerrar Sesión"** (botón superior derecho)
2. Volverás al login

---

## 🔐 Características de Seguridad (OWASP)

✅ **Autenticación Segura**
- Hashing bcryptjs (12 rounds)
- 3 intentos máximos + bloqueo 15 min

✅ **Protección contra Inyección**
- Validación de entrada con Zod
- Queries parameterizadas

✅ **Control de Acceso**
- Roles: Administrator, Manager, ADM_INV
- Permisos específicos por rol

✅ **Rate Limiting**
- Máximo 100 requests/15 minutos por IP
- Protección contra fuerza bruta

✅ **Auditoría**
- Registro de intentos de login
- Seguimiento de IP

---

## 📁 Estructura del Proyecto

\`\`\`
├── app/
│   ├── api/
│   │   ├── auth/login/       # Login API (con seguridad OWASP)
│   │   └── products/         # CRUD de productos
│   ├── dashboard/            # Panel principal
│   ├── page.tsx              # Login page
│   └── layout.tsx            # Layout global
├── components/
│   ├── add-product-form.tsx  # Formulario de productos
│   ├── login-form.tsx        # Formulario de login
│   └── ui/                   # Componentes reutilizables
├── lib/
│   ├── security/
│   │   ├── password-hash.ts       # bcryptjs hashing
│   │   ├── login-attempts.ts      # Account lockout
│   │   ├── csrf-protection.ts     # CSRF tokens
│   │   ├── input-validation.ts    # Zod validation
│   │   ├── auth-middleware.ts     # Auth checks
│   │   └── rate-limit.ts          # Rate limiting
│   └── database.ts           # Conexión a Neon
├── scripts/
│   ├── 01-init-database.sql       # Crear tablas
│   ├── setup-all-users.ts         # Generar hashes
│   └── test-connection.js         # Test BD
├── SECURITY.md               # Documentación de seguridad OWASP
└── QUICK_START.md            # Esta guía
\`\`\`

---

## 🆘 Solucionar Problemas

### Error: "DATABASE_URL not found"
- Verifica que `.env` tenga la variable
- Reinicia el servidor: Ctrl+C y `npm run dev`

### Error: "Cannot connect to Neon"
- Verifica que la URL sea correcta
- Copia nuevamente desde Neon Dashboard
- Verifica que tengas conexión a internet

### Puerto 3000 ocupado
\`\`\`bash
npm run dev -- -p 3001
\`\`\`

### Las contraseñas no funcionan
- Verifica que ejecutaste `setup-all-users.ts`
- Copia y ejecuta los UPDATE en Neon SQL Editor

### El botón "Agregar Producto" no funciona
- Verifica que estés logueado como Admin, Manager o ADM_INV
- Abre la consola del navegador (F12) para ver errores

---

## 📚 Recursos Adicionales

- Documentación de Seguridad: `SECURITY.md`
- Informe del Proyecto: Ver archivo PDF proporcionado
- Base de Datos: Neon Dashboard

---

## ✨ Funciones Completamente Implementadas

✅ Login con 3 intentos (bloqueo 15 min)
✅ Gestión de productos (CRUD)
✅ Búsqueda y filtrado
✅ Control de roles y permisos
✅ Auditoría de logins
✅ Validación de entrada (Zod)
✅ Rate limiting
✅ Hashing seguro (bcryptjs)
✅ Sesiones con cookies seguras
✅ UI responsiva (Tailwind CSS)
✅ Base de datos en Neon PostgreSQL

¡Sistema listo para producción! 🚀
