'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login'); // Toggle between modes
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'USER',
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, role: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const endpoint =
        mode === 'login'
          ? 'http://localhost:8080/api/auth/login'
          : 'http://localhost:8080/api/users';
      const body =
        mode === 'login'
          ? { email: formData.email, password: formData.password }
          : formData;

      const isAdminRegister = mode === 'register' && formData.role === 'ADMIN';
      if (isAdminRegister) {
        const isAdminExisting = await fetch(
          'http://localhost:8080/api/users/isAdminExists'
        );

        const data = await isAdminExisting.json();
        if (data.adminExists) {
          const proceed = confirm(
            'An ADMIN already exists. Do you want to replace the current ADMIN?'
          );
          if (!proceed) {
            setFormData({ ...formData, role: 'USER' });
            // exit the function
            return;
          }
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const resJson = await response.json();
        const errorMessages = resJson.message || resJson.error;
        alert('Failed to authenticate: ' + errorMessages);
        throw new Error('Failed to authenticate');
      }
      if (mode === 'register') {
        alert('Registered successfully');
        setMode('login');
        router.push('/auth'); // Redirect to login page
        return;
      }

      const data = await response.json();
      localStorage.setItem('user_id', JSON.stringify(data.user_id)); // Save USER info
      localStorage.setItem('access_token', data.access_token); // Save token
      alert('Authenticated successfully');
      router.push('/posts'); // Redirect to homepage or dashboard
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">
          {mode === 'login' ? 'Login' : 'Register'}
        </CardTitle>
        <CardDescription>
          {mode === 'login'
            ? 'Enter your email below to login to your account'
            : 'Fill in the details to create an account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <form onSubmit={handleSubmit} className="grid gap-4">
          {mode === 'register' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required={mode === 'register'}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required={mode === 'register'}
                />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <div className="flex gap-4">
                  <div>
                    <input
                      type="radio"
                      id="USER"
                      name="role"
                      value="USER"
                      checked={formData.role === 'USER'}
                      onChange={handleRoleChange}
                    />
                    <Label htmlFor="USER" className="ml-2 cursor-pointer">
                      User
                    </Label>
                  </div>
                  <div>
                    <input
                      type="radio"
                      id="ADMIN"
                      name="role"
                      value="ADMIN"
                      checked={formData.role === 'ADMIN'}
                      onChange={handleRoleChange}
                    />
                    <Label htmlFor="ADMIN" className="ml-2 cursor-pointer">
                      Admin
                    </Label>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            {mode === 'login' ? 'Login' : 'Register'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <span
                onClick={() => setMode('register')}
                className="underline cursor-pointer"
              >
                Sign up
              </span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span
                onClick={() => setMode('login')}
                className="underline cursor-pointer"
              >
                Login
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
