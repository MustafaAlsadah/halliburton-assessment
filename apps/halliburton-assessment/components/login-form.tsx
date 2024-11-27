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
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const endpoint =
        mode === 'login'
          ? 'http://localhost:8080/api/auth/login'
          : 'http://localhost:8080/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        alert('Failed to authenticate: ' + response.statusText);
        throw new Error('Failed to authenticate');
      }

      const data = await response.json();
      localStorage.setItem('user_id', JSON.stringify(data.user_id)); // Save user info
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
              Don't have an account?{' '}
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
