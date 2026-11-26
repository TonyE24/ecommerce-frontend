'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export async function loginAction(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const data = await apiFetch<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const cookieStore = await cookies();
    cookieStore.set('jwt_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 día
    });
  } catch (error: any) {
    return { error: error.message || 'Credenciales inválidas' };
  }

  redirect('/dashboard/ordenes');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('jwt_token');
  redirect('/login');
}