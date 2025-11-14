-- Drop existing tables if they exist (development only)
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS login_attempts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Create roles table
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role_id INTEGER NOT NULL REFERENCES roles(id),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create login attempts table (for security - rate limiting)
CREATE TABLE login_attempts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN DEFAULT FALSE
);

-- Create categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  price DECIMAL(10, 2) NOT NULL,
  current_stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 5,
  size VARCHAR(50),
  color VARCHAR(50),
  gender VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stock movements table (history)
CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  movement_type VARCHAR(20) NOT NULL, -- 'IN', 'OUT'
  quantity INTEGER NOT NULL,
  reason TEXT,
  previous_stock INTEGER,
  new_stock INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_user ON stock_movements(user_id);
CREATE INDEX idx_login_attempts_email ON login_attempts(email);

-- Insert roles
INSERT INTO roles (name, description) VALUES
('Administrator', 'System administrator with full access'),
('Manager', 'Manager with product and stock control access'),
('ADM_INV', 'Inventory administrator for stock control');

-- Insert admin user (password: admin123 -> will be hashed in app)
-- This is a placeholder - actual hash will be inserted via app
INSERT INTO users (email, password_hash, first_name, last_name, role_id, active) VALUES
('admin@yenijeans.com', '$2b$10$YourHashHere', 'Admin', 'YeniJeans', 1, TRUE);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Jeans Degradados', 'Jeans con efecto degradado'),
('Jeans Clásicos', 'Jeans de diseño clásico y versátil'),
('Casacas', 'Casacas y prendas de abrigo');

-- Insert sample products
INSERT INTO products (code, name, description, category_id, price, current_stock, size, color, gender) VALUES
('PRD-631348', 'Casaca Overside', 'Casaca de corte oversize para mujer', 3, 150.90, 2, '32', 'Celeste', 'Mujer'),
('PRD-654873', 'Jean recto', 'Jean recto clásico de calidad premium', 2, 45.00, 20, '30', 'Negro', 'Mujer'),
('PRD-165636', 'Falda recta', 'Falda recta elegante para mujer', 1, 50.00, 15, '30', 'Negro', 'Mujer');
