'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type AuthResponse = {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    token_type: 'bearer';
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
};

type ActionState = {
  error?: string;
};

function getFormString(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value : '';
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return fallback;
}

async function saveAuthToken(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set('jwt_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState | never> {
  const email = getFormString(formData, 'email').trim();
  const password = getFormString(formData, 'password');

  try {
    const response = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    await saveAuthToken(response.data.access_token);
  } catch (error: unknown) {
    return {
      error: getErrorMessage(error, 'No se pudo iniciar sesión.'),
    };
  }

  redirect('/dashboard/ordenes');
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState | never> {
  const name = getFormString(formData, 'name').trim();
  const email = getFormString(formData, 'email').trim();
  const password = getFormString(formData, 'password');
  const passwordConfirmation = getFormString(
    formData,
    'password_confirmation',
  );

  try {
    const response = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });

    await saveAuthToken(response.data.access_token);
  } catch (error: unknown) {
    return {
      error: getErrorMessage(error, 'No se pudo crear la cuenta.'),
    };
  }

  redirect('/dashboard/ordenes');
}

export async function logoutAction(): Promise<never> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt_token')?.value;

  try {
    if (token) {
      await apiFetch('/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } finally {
    cookieStore.delete('jwt_token');
  }

  redirect('/login');
}