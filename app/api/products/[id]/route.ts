import { sql } from '@/lib/database';
import { validateProduct } from '@/lib/security/input-validation';
import { apiLimiter } from '@/lib/security/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

function getRoleFromRequest(request: NextRequest): string | null {
  return request.headers.get('X-User-Role') || null;
}

function getUserIdFromRequest(request: NextRequest): number | null {
  const userIdHeader = request.headers.get('X-User-Id');
  return userIdHeader ? parseInt(userIdHeader) : null;
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

    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID required', error_code: 'USER_ID_REQUIRED' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    console.log('[DEBUG PUT] Received data:', body);

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

    const { name, description, categoryId, price, size, color, gender, stock } = validation.data;

    const priceNum = Number(price);
    const categoryNum = Number(categoryId);
    const idNum = Number(id);
    const newStock = stock !== undefined ? Number(stock) : null;

    console.log('[DEBUG PUT] Processing update for product:', idNum);

    // Obtener stock actual antes de actualizar
    const currentProduct = await sql`
      SELECT current_stock FROM products WHERE id = ${idNum} AND active = true
    `;

    if (currentProduct.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Product not found', error_code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const previousStock = currentProduct[0].current_stock;

    // Actualizar producto
    let result;
    if (newStock !== null) {
      result = await sql`
        UPDATE products 
        SET name = ${name},
            description = ${description || ''},
            category_id = ${categoryNum},
            price = ${priceNum},
            size = ${size || ''},
            color = ${color || ''},
            gender = ${gender || ''},
            current_stock = ${newStock},
            updated_at = NOW()
        WHERE id = ${idNum} AND active = true
        RETURNING *
      `;
    } else {
      result = await sql`
        UPDATE products 
        SET name = ${name},
            description = ${description || ''},
            category_id = ${categoryNum},
            price = ${priceNum},
            size = ${size || ''},
            color = ${color || ''},
            gender = ${gender || ''},
            updated_at = NOW()
        WHERE id = ${idNum} AND active = true
        RETURNING *
      `;
    }

    console.log('[DEBUG PUT] Product updated:', result[0]);

    // Registrar movimiento si cambió el stock
    if (newStock !== null && previousStock !== newStock) {
      const quantity = newStock - previousStock;
      const movementType = quantity > 0 ? 'ENTRADA' : 'SALIDA';
      
      await sql`
        INSERT INTO inventory_movements (
          product_id, user_id, movement_type, quantity, previous_stock, new_stock, reason
        )
        VALUES (
          ${idNum}, ${userId}, ${movementType}, ${Math.abs(quantity)}, ${previousStock}, ${newStock}, 'Ajuste de inventario desde edición de producto'
        )
      `;

      console.log('[DEBUG PUT] Movement created:', movementType, Math.abs(quantity));
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