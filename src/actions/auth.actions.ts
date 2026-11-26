"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { ACCESS_TOKEN_COOKIE } from "@/lib/constants";
import type { AuthResponse } from "@/types";

async function authenticate(
  endpoint: "/auth/login" | "/auth/register",
  formData: FormData,
) {
  const email = formData.get("email");
  const password = formData.get("password");
  const name = formData.get("name");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    throw new Error("El correo y la contraseña son obligatorios.");
  }

  const payload =
    endpoint === "/auth/register"
      ? { email: email.trim(), password, name: typeof name === "string" ? name.trim() : "" }
      : { email: email.trim(), password };
  const result = await apiRequest<AuthResponse>(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!result.accessToken) {
    throw new Error("La respuesta de autenticación no incluyó un token.");
  }

  (await cookies()).set(ACCESS_TOKEN_COOKIE, result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function login(formData: FormData) {
  await authenticate("/auth/login", formData);
  redirect("/dashboard/ordenes");
}

export async function register(formData: FormData) {
  await authenticate("/auth/register", formData);
  redirect("/dashboard/ordenes");
}

export async function logout() {
  (await cookies()).delete(ACCESS_TOKEN_COOKIE);
  redirect("/login");
}
