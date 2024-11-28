// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client';
import { useEffect, useState, useTransition } from 'react';
import { JwtPayload, jwtDecode } from 'jwt-decode';
import { User } from '@/../../apps/backend/src/app/users/entities/user.entity';
import { useAsyncRoutePush } from './useAsyncPush';

interface ExtendedJwtPayload extends JwtPayload {
  role?: string;
}

export default function useAuth(isAdminRoute = false) {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  const asyncPush = useAsyncRoutePush();

  useEffect(() => {
    async function func() {
      const token = localStorage.getItem('access_token');

      if (!token) {
        await asyncPush('/auth');
      } else {
        try {
          // Decode JWT token to extract user role and expiration
          const decoded = jwtDecode<Partial<User>>(token as string);

          const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

          if (decoded.exp && decoded.exp < currentTime) {
            // Token is expired
            console.warn('Token has expired.');
            localStorage.removeItem('access_token'); // Remove expired token

            await asyncPush('/auth'); // Redirect to login
          } else {
            setIsAdmin(decoded.role === 'ADMIN');

            // Redirect non-admins away from admin routes
            if (isAdminRoute && decoded.role !== 'ADMIN') {
              await asyncPush('/posts');
            }
          }
        } catch (error) {
          console.error('Invalid token:', error);
          localStorage.removeItem('access_token'); // Remove invalid token
          await asyncPush('/auth');
        } finally {
          setLoading(false);
        }
      }
    }
    func();
  }, [isAdminRoute]);

  return { isAdmin, loading };
}
