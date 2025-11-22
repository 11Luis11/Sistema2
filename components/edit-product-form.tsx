'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Save } from 'lucide-react';

interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  price: number;
  current_stock: number;
  size: string;
  color: string;
  gender: string;
}

interface EditProductFormProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProductForm({ product, onClose, onSuccess }: EditProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    categoryId: '1',
    price: product.price.toString(),
    size: product.size || '',
    color: product.color || '',
    gender: product.gender || 'Unisex',
    stock: product.current_stock.toString(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.name || !formData.price) {
        setError('Por favor completa los campos requeridos');
        setLoading(false);
        return;
      }

      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('sessionToken');
      
      if (!userStr || !token) {
        setError('Sesión expirada. Por favor inicia sesión de nuevo');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);

      console.log('[Edit] Sending update for product:', product.id);

      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-Role': user.role || '',
          'X-User-Id': user.id?.toString() || '',
        },
        body: JSON.stringify({
          code: product.code, // Agregar el código aunque no se modifique
          name: formData.name,
          description: formData.description,
          categoryId: parseInt(formData.categoryId),
          price: parseFloat(formData.price),
          size: formData.size,
          color: formData.color,
          gender: formData.gender,
          stock: parseInt(formData.stock),
        }),
      });

      console.log('[Edit] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Edit] Error response:', errorText);
        
        try {
          const data = JSON.parse(errorText);
          setError(data.message || `Error al actualizar el producto (${response.status})`);
        } catch {
          setError(`Error al actualizar el producto (${response.status})`);
        }
        return;
      }

      const data = await response.json();
      console.log('[Edit] Success response:', data);

      onSuccess();
      onClose();
    } catch (err) {
      setError('Error al actualizar el producto');
      console.error('[Edit] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-card">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Editar Producto</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Código del Producto
              </label>
              <Input
                type="text"
                value={product.code}
                disabled
                className="bg-muted border-border cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">El código no se puede modificar</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nombre *
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="ej: Jean Clásico"
                className="bg-input border-border"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripción del producto"
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Categoría
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="1">Jeans Clásicos</option>
                <option value="2">Jeans Degradados</option>
                <option value="3">Casacas</option>
                <option value="4">Accesorios</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Precio (S/) *
              </label>
              <Input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Talla
              </label>
              <Input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
                placeholder="ej: S, M, L, XL"
                className="bg-input border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Color
              </label>
              <Input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="ej: Negro, Azul"
                className="bg-input border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Género
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Mujer">Mujer</option>
                <option value="Hombre">Hombre</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Stock Actual
            </label>
            <Input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
              className="bg-input border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Stock anterior: <span className="font-semibold">{product.current_stock}</span>
              {parseInt(formData.stock) !== product.current_stock && (
                <span className="ml-2 text-primary">
                  (cambio: {parseInt(formData.stock) - product.current_stock > 0 ? '+' : ''}{parseInt(formData.stock) - product.current_stock})
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              disabled={loading}
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}