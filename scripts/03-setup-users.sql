-- Script para crear usuarios con diferentes roles
-- Ejecuta este script en Neon SQL Editor

-- ============================================
-- USUARIO 1: ADMINISTRADOR
-- Email: admin@yenijeans.com
-- Contraseña: admin123
-- Rol: Administrator
-- ============================================

-- Genera el hash con este comando en Node.js:
-- const crypto = require('crypto');
-- const password = 'admin123';
-- const salt = crypto.randomBytes(32).toString('hex');
-- const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
-- console.log('SALT:', salt);
-- console.log('HASH:', hash);

-- Luego ejecuta (reemplaza SALT y HASH con los valores generados):
UPDATE users 
SET password_hash = '[HASH_AQUI]', 
    password_salt = '[SALT_AQUI]',
    first_name = 'Administrador',
    last_name = 'YeniJeans',
    role = 'Administrator',
    is_active = true
WHERE email = 'admin@yenijeans.com';

-- ============================================
-- USUARIO 2: GERENTE
-- Email: gerente@yenijeans.com
-- Contraseña: gerente123
-- Rol: Manager
-- ============================================

-- Genera el hash:
-- const crypto = require('crypto');
-- const password = 'gerente123';
-- const salt = crypto.randomBytes(32).toString('hex');
-- const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');

INSERT INTO users (email, password_hash, password_salt, first_name, last_name, role, is_active)
VALUES (
  'gerente@yenijeans.com',
  '[HASH_AQUI]',
  '[SALT_AQUI]',
  'Gerente',
  'YeniJeans',
  'Manager',
  true
);

-- ============================================
-- USUARIO 3: ADMINISTRADOR DE INVENTARIO
-- Email: adm_inv@yenijeans.com
-- Contraseña: adm_inv123
-- Rol: ADM_INV
-- ============================================

-- Genera el hash:
-- const crypto = require('crypto');
-- const password = 'adm_inv123';
-- const salt = crypto.randomBytes(32).toString('hex');
-- const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');

INSERT INTO users (email, password_hash, password_salt, first_name, last_name, role, is_active)
VALUES (
  'adm_inv@yenijeans.com',
  '[HASH_AQUI]',
  '[SALT_AQUI]',
  'Administrador',
  'Inventario',
  'ADM_INV',
  true
);

-- ============================================
-- SCRIPT AUTOMATIZADO PARA GENERAR TODOS LOS HASHES
-- ============================================
-- Si prefieres hacerlo más rápido, usa este script en Node.js:
-- 
-- const crypto = require('crypto');
-- 
-- const users = [
--   { email: 'admin@yenijeans.com', password: 'admin123', role: 'Administrator' },
--   { email: 'gerente@yenijeans.com', password: 'gerente123', role: 'Manager' },
--   { email: 'adm_inv@yenijeans.com', password: 'adm_inv123', role: 'ADM_INV' }
-- ];
-- 
-- users.forEach(user => {
--   const salt = crypto.randomBytes(32).toString('hex');
--   const hash = crypto.pbkdf2Sync(user.password, salt, 100000, 32, 'sha256').toString('hex');
--   
--   console.log(`\n${user.email}:`);
--   console.log(`UPDATE users SET password_hash = '${hash}', password_salt = '${salt}', role = '${user.role}', first_name = 'Usuario', last_name = '${user.role}' WHERE email = '${user.email}';`);
-- });
