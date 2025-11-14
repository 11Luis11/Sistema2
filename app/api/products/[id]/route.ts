import { sql } from '@/lib/database';
import { validateProduct } from '@/lib/security/input-validation';
import { apiLimiter } from '@/lib/security/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

function getRoleFromRequest(request: NextRequest): string | null {
  return request.headers.get('X-User-Role') || null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitCheck = apiLimiter.check(`products:put:${ip}`);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const role = getRoleFromRequest(request);

    if (!['Administrator', 'Manager'].includes(role || '')) {
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

    const { name, description, categoryId, price, size, color, gender } = validation.data;

    const priceNum = Number(price);
    const categoryNum = Number(categoryId);
    const idNum = Number(id);

    const result = await sql`
      UPDATE products 
      SET name = ${name},
          description = ${description},
          category_id = ${categoryNum},
          price = ${priceNum},
          size = ${size},
          color = ${color},
          gender = ${gender},
          updated_at = NOW()
      WHERE id = ${idNum} AND active = true
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Product not found', error_code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: result[0],
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('[Update Product Error]', error);
    return NextResponse.json(
      { success: false, message: 'Error updating product', error_code: 'UPDATE_ERROR' },
      { status: 500 }
    );
  }
}


// ------------------------------------------------------------
// 🔥 DELETE REAL — ELIMINA DEFINITIVAMENTE DE LA BD
// ------------------------------------------------------------
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
        { success: false, message: 'Unauthorized: insufficient permissions', error_code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const productId = Number(id);

    // DELETE DEFINITIVO
    const result = await sql`
      DELETE FROM products
      WHERE id = ${productId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Product not found', error_code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted permanently',
    });
  } catch (error) {
    console.error('[Delete Product Error]', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting product', error_code: 'DELETE_ERROR' },
      { status: 500 }
    );
  }
}
