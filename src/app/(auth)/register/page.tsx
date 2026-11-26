"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/actions/auth.actions";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, {});

  return (
    <section className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl font-bold">Crear cuenta</h1>
      <form action={formAction} className="space-y-4">
        <label className="block space-y-1">
          <span>Nombre</span>
          <input
            autoComplete="name"
            className="w-full rounded border p-2"
            name="name"
            required
          />
        </label>
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
            autoComplete="new-password"
            className="w-full rounded border p-2"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>
        <label className="block space-y-1">
          <span>Confirmar contraseña</span>
          <input
            autoComplete="new-password"
            className="w-full rounded border p-2"
            minLength={8}
            name="password_confirmation"
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
          {pending ? "Creando cuenta..." : "Registrarme"}
        </button>
      </form>
      <p className="mt-4">
        ¿Ya tienes cuenta? <Link className="underline" href="/login">Inicia sesión</Link>
      </p>
    </section>
  );
}
