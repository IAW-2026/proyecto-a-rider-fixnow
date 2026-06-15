"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, Clock, Droplets, Flame, Shield, Zap } from "lucide-react";
import {
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface WelcomePageProps {
  className?: string;
}

export function WelcomePage({ className }: WelcomePageProps) {
  const { isSignedIn } = useUser();

  return (
    <div className={cn("flex min-h-screen bg-slate-950", className)}>
      {/* Left Side - Hero Content */}
      <div className="flex flex-1 flex-col justify-between px-6 py-6 lg:px-6 lg:py-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold text-white">FixNow</h1>
          </div>
          <div className="flex items-center gap-3">
            {!isSignedIn ? (
              <>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="px-4 py-2 text-white transition hover:text-amber-400">
                    Iniciar Sesion
                  </button>
                </SignInButton>
                <SignUpButton mode="modal" forceRedirectUrl="/complete-profile">
                  <button className="rounded-lg bg-amber-400 px-6 py-2 font-semibold text-slate-950 transition hover:bg-amber-300">
                    Registrarse
                  </button>
                </SignUpButton>
              </>
            ) : (
              <>
                <SignOutButton>
                  <button className="rounded-lg border border-slate-600 px-4 py-2 font-semibold text-white transition hover:bg-slate-800">
                    Cerrar sesion
                  </button>
                </SignOutButton>
                <UserButton />
              </>
            )}
          </div>
        </header>

        {/* Main Hero Content */}
        <div className="flex flex-1 flex-col items-start justify-center py-12 max-w-2xl">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
            <span className="text-amber-400">Tu hogar</span>
            <br />
            <span className="text-white">en buenas manos</span>
          </h2>

          <p className="mt-6 text-lg text-slate-300 leading-relaxed">
            Conectamos profesionales certificados con tu hogar. Plomería,
            electricidad y gas en minutos, con seguimiento en tiempo real.
          </p>

          {/* Features */}
          <div className="mt-10 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-slate-300">
                Respuesta en menos de 30 minutos
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700">
                <Shield className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-slate-300">Profesionales certificados</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700">
                <Check className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-slate-300">
                Garantia en todos los servicios
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex gap-4">
            {!isSignedIn ? (
              <>
                {/* <SignUpButton mode="modal" forceRedirectUrl="/complete-profile">
                  <button className="rounded-lg bg-green-600 px-8 py-3 font-semibold text-white transition hover:bg-green-700">
                    Comenzar ahora -&gt;
                  </button>
                </SignUpButton>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="rounded-lg border border-slate-600 px-8 py-3 font-semibold text-white transition hover:bg-slate-800">
                    Ya tengo cuenta
                  </button>
                </SignInButton> */}
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-green-600 px-8 py-3 font-semibold text-white transition hover:bg-green-700"
                >
                  Ir al dashboard
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between text-sm text-slate-400">
          <p>&copy; 2026 FixNow. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition">
              Privacidad
            </a>
            <a href="#" className="hover:text-white transition">
              Términos
            </a>
          </div>
        </footer>
      </div>

      {/* Right Side - Logo & Services */}
      <div className="hidden flex-col items-center justify-center bg-linear-to-b from-slate-700 to-slate-950 px-12 lg:flex lg:w-[45%]">
        {/* Large Logo */}
        <div className="mb-12 flex w-full items-center justify-center">
          <span className="text-8xl font-bold text-slate-950">
            <Image
              src="/fix_now_logo_.png"
              alt="Logo"
              width={400}
              height={400}
            />
          </span>
        </div>

        {/* Services Grid */}
        <div className="grid w-full max-w-sm grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col items-center gap-2 rounded-xl bg-white/10 p-4 hover:bg-white/20 transition backdrop-blur-sm">
            <Droplets className="h-8 w-8 text-blue-400" />
            <span className="text-xs text-center text-white">Plomeria</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl bg-white/10 p-4 hover:bg-white/20 transition backdrop-blur-sm">
            <Zap className="h-8 w-8 text-yellow-400" />
            <span className="text-xs text-center text-white">Electricidad</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl bg-white/10 p-4 hover:bg-white/20 transition backdrop-blur-sm">
            <Flame className="h-8 w-8 text-red-400" />
            <span className="text-xs text-center text-white">Gas</span>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
          <Shield className="h-4 w-4 text-amber-400" />
          <span className="text-xs text-white/70">
            +5,000 servicios completados
          </span>
        </div>
      </div>
    </div>
  );
}
