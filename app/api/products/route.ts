import { sql } from '@/lib/database';
import { validateProduct } from '@/lib/security/input-validation';
import { apiLimiter } from '@/lib/security/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

// Helper to extract role
function getRoleFromRequest(request: NextRequest): string | null {
  return request.headers.get('X-User-Role') || null;
}

// Helper: extrae ID desde URL con soporte para /api/products/123 y /api/products?id=123
function extractId(request: NextRequest): number | null {
  const url = new URL(request.url);

  // caso /api/products?id=123
  const paramId = url.searchParams.get('id');
  if (paramId) return Number(paramId);

  // caso /api/products/123
  const parts = url.pathname.split('/');
  const last = parts[parts.length - 1];

  const numericId = Number(last);
  if (!isNaN(numericId)) return numericId;

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitCheck = apiLimiter.check(`products:get:${ip}`);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');

    const searchPattern = `%${search}%`;
    const category = categoryId ? parseInt(categoryId) : null;

    let products;

    if (search && category) {
      products = await sql`
        SELECT 
          p.id, p.code, p.name, p.description, p.price, p.current_stock,
          p.size, p.color, p.gender, c.name AS category,
          p.created_at, p.updated_at
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.active = true
          AND (p.name ILIKE ${searchPattern} OR p.code ILIKE ${searchPattern})
          AND p.category_id = ${category}
        ORDER BY p.created_at DESC
        LIMIT 1000
      `;
    } else if (search) {
      products = await sql`
        SELECT 
          p.id, p.code, p.name, p.description, p.price, p.current_stock,
          p.size, p.color, p.gender, c.name AS category,
          p.created_at, p.updated_at
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.active = true
          AND (p.name ILIKE ${searchPattern} OR p.code ILIKE ${searchPattern})
        ORDER BY p.created_at DESC
        LIMIT 1000
      `;
    } else if (category) {
      products = await sql`
        SELECT 
          p.id, p.code, p.name, p.description, p.price, p.current_stock,
          p.size, p.color, p.gender, c.name AS category,
          p.created_at, p.updated_at
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.active = true
          AND p.category_id = ${category}
        ORDER BY p.created_at DESC
        LIMIT 1000
      `;
    } else {
      products = await sql`
        SELECT 
          p.id, p.code, p.name, p.description, p.price, p.current_stock,
          p.size, p.color, p.gender, c.name AS category,
          p.created_at, p.updated_at
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.active = true
        ORDER BY p.created_at DESC
        LIMIT 1000
      `;
    }

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('[Products GET Error]', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching products', error_code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitCheck = apiLimiter.check(`products:post:${ip}`);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const role = getRoleFromRequest(request);

    if (!['Administrator', 'Manager', 'ADM_INV'].includes(role || '')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: insufficient permissions', error_code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = validateProduct(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid product data',
          errors: validation.error.flatten(),
          error_code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const { code, name, description, categoryId, price, size, color, gender, stock } =
      validation.data;

    const priceValue = Number(price);
    if (isNaN(priceValue)) {
      return NextResponse.json(
        { success: false, message: 'Price must be a valid number' },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id FROM products WHERE UPPER(code) = UPPER(${code})
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Product code already exists',
          error_code: 'DUPLICATE_CODE',
        },
        { status: 409 }
      );
    }

    const result = await sql`
      INSERT INTO products (code, name, description, category_id, price, size, color, gender, current_stock, active)
      VALUES (${code}, ${name}, ${description}, ${categoryId}, ${priceValue}, ${size}, ${color}, ${gender}, ${stock || 0}, true)
      RETURNING *
    `;

    return NextResponse.json(
      { success: true, message: 'Product created successfully', product: result[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Products POST Error]', error);
    return NextResponse.json(
      { success: false, message: 'Error creating product', error_code: 'CREATE_ERROR' },
      { status: 500 }
    );
  }
}

// -----------------------------
// 🔥 DELETE QUE AHORA SÍ BORRA DE VERDAD
// -----------------------------
export async function DELETE(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitCheck = apiLimiter.check(`products:delete:${ip}`);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const role = getRoleFromRequest(request);

    if (!['Administrator', 'Manager', 'ADM_INV'].includes(role || '')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: insufficient permissions' },
        { status: 403 }
      );
    }

    const productId = extractId(request);

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID required' },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM products
      WHERE id = ${productId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Product deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Products DELETE Error]', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting product' },
      { status: 500 }
    );
  }
}
