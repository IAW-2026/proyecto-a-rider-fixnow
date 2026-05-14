"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const initialFullName = useMemo(() => {
    const first = user?.firstName ?? "";
    const last = user?.lastName ?? "";
    return `${first} ${last}`.trim();
  }, [user?.firstName, user?.lastName]);

  const [fullName, setFullName] = useState(initialFullName);
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialFullName && !fullName) {
      setFullName(initialFullName);
    }
  }, [initialFullName, fullName]);

  useEffect(() => {
    if (isLoaded && user?.unsafeMetadata?.address) {
      router.replace("/dashboard");
    }
  }, [isLoaded, router, user?.unsafeMetadata?.address]);

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        Cargando perfil...
      </main>
    );
  }

  if (user?.unsafeMetadata?.address) {
    return null;
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/);
      const lastName = lastNameParts.join(" ");

      await user.update({
        firstName: firstName || user.firstName || undefined,
        lastName: lastName || user.lastName || undefined,
        unsafeMetadata: {
          ...(user.unsafeMetadata ?? {}),
          address,
          profileCompleted: true,
        },
      });

      router.push("/dashboard");
    } catch {
      setError("No se pudo guardar el perfil. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold">Completa tu perfil</h1>
        <p className="mt-2 text-slate-300">
          Antes de ingresar al dashboard, necesitamos estos datos.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-200"
              htmlFor="fullName"
            >
              Nombre completo
            </label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-amber-400"
              placeholder="Ej: Catalina Perez"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-200"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              value={email}
              readOnly
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-300"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-200"
              htmlFor="address"
            >
              Direccion
            </label>
            <input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-amber-400"
              placeholder="Ej: Av. Alem 123, Bahia Blanca"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-amber-400 px-6 py-2 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
            >
              {isSaving ? "Guardando..." : "Guardar y continuar"}
            </button>
            <Link href="/" className="text-sm text-slate-300 hover:text-white">
              Volver
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
