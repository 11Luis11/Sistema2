'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Alert,
  AlertTitle,
  AlertDescription
} from '@/components/ui/alert';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [rememberMe, setRememberMe] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }
        return;
      }

      // Save session
      if (rememberMe) {
        localStorage.setItem('userEmail', email);
      }
      localStorage.setItem('sessionToken', data.sessionToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Brand */}
        <div className="hidden md:flex flex-col items-center justify-center text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl font-bold text-primary-foreground">Y</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">YeniJeans</h1>
          <p className="text-muted-foreground text-lg mb-2">Control de Inventario</p>
          <p className="text-muted-foreground">Gestiona tu inventario de jeans y casacas de manera eficiente y moderna</p>
        </div>

        {/* Right side - Login Form */}
        <Card className="p-8 shadow-lg">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Iniciar Sesión</h2>
            <p className="text-muted-foreground">Accede a tu panel de control</p>
          </div>

          {error && (
            <Alert className="mb-6 bg-destructive/10 border-destructive text-destructive">
              {error}
              {attemptsLeft > 0 && attemptsLeft < 3 && (
                <div className="text-sm mt-2">
                  Intentos restantes: {attemptsLeft}
                </div>
              )}
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Correo electrónico
              </label>
              <Input
                type="email"
                placeholder="user@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-input border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Contraseña
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-input border-border"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                Recordar sesión
              </label>
              <a href="#" className="text-sm text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            ¿No tienes cuenta? <span className="text-primary cursor-pointer hover:underline">Regístrate aquí</span>
          </div>

          <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground text-center">
            Sistema de gestión de inventario YeniJeans. Todos los derechos reservados.
          </div>
        </Card>
      </div>
    </div>
  );
}
