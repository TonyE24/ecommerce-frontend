"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/actions/auth.actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <section className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl font-bold">Iniciar sesión</h1>
      <form action={formAction} className="space-y-4">
        <label className="block space-y-1">
          <span>Correo electrónico</span>
          <input
            autoComplete="email"
            className="w-full rounded border p-2"
            name="email"
            required
            type="email"
          />
        </label>
        <label className="block space-y-1">
          <span>Contraseña</span>
          <input
            autoComplete="current-password"
            className="w-full rounded border p-2"
            name="password"
            required
            type="password"
          />
        </label>
        {state.error && <p role="alert">{state.error}</p>}
        <button
          className="rounded bg-zinc-900 px-4 py-2 text-white"
          disabled={pending}
          type="submit"
        >
          {pending ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
      <p className="mt-4">
        ¿No tienes cuenta? <Link className="underline" href="/register">Regístrate</Link>
      </p>
    </section>
  );
}
