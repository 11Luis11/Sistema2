'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2 } from 'lucide-react';

interface ManageUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

export function UserManagementTab() {
  const [users, setUsers] = useState<ManageUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    userRole: 'ADM_INV',
    password: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const token = localStorage.getItem('sessionToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Role': user.role
        }
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('sessionToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const url = editingId ? '/api/users' : '/api/users';
      const method = editingId ? 'PUT' : 'POST';
      const payload = editingId 
        ? { id: editingId, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-Role': user.role
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || `Error al ${editingId ? 'actualizar' : 'crear'} usuario`);
        return;
      }

      alert(`Usuario ${editingId ? 'actualizado' : 'creado'} exitosamente`);
      setFormData({ email: '', firstName: '', lastName: '', userRole: 'ADM_INV', password: '' });
      setEditingId(null);
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError('Error al conectar con el servidor');
      console.error(err);
    }
  }

  function handleEditUser(u: ManageUser) {
    setEditingId(u.id);
    setFormData({
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      userRole: u.role,
      password: ''
    });
    setShowForm(true);
  }

  async function handleDeleteUser(id: number) {
    if (!confirm('¿Está seguro que desea eliminar este usuario?')) return;

    try {
      const token = localStorage.getItem('sessionToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Role': user.role
        }
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Error al eliminar usuario');
        return;
      }

      alert('Usuario eliminado exitosamente');
      fetchUsers();
    } catch (err) {
      alert('Error al conectar con el servidor');
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Gestionar Usuarios</h2>
          <p className="text-muted-foreground">Crea y administra cuentas de usuario</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setFormData({ email: '', firstName: '', lastName: '', userRole: 'ADM_INV', password: '' });
            setShowForm(!showForm);
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <h3 className="text-lg font-bold mb-4 text-foreground">
            {editingId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Nombre</label>
                <Input
                  type="text"
                  placeholder="Juan"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Apellido</label>
                <Input
                  type="text"
                  placeholder="Pérez"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="juan.perez@yenijeans.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Rol</label>
                <select
                  value={formData.userRole}
                  onChange={(e) => setFormData({ ...formData, userRole: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
                >
                  <option value="ADM_INV">Administrador de Inventario</option>
                  <option value="Manager">Gerente</option>
                  <option value="Administrator">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  {editingId ? 'Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
                </label>
                <Input
                  type="password"
                  placeholder={editingId ? 'Dejar vacío para mantener actual' : 'Mínimo 8 caracteres'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingId}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingId ? 'Actualizar Usuario' : 'Crear Usuario'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Nombre</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Rol</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-border hover:bg-muted/50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{u.first_name} {u.last_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                        {u.role || 'Sin rol'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        u.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <button
                        onClick={() => handleEditUser(u)}
                        className="p-2 hover:bg-blue-100 rounded text-blue-600 transition"
                        title="Editar usuario"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 hover:bg-red-100 rounded text-red-600 transition"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
