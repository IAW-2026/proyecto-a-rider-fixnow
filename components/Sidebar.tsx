"use client";

import { Home, Wrench, History, User, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton, useUser } from "@clerk/nextjs";

type View = "home" | "active" | "history";

interface AppSidebarProps {
  currentView: View;
}

const navItems = [
  { id: "home" as const, label: "Inicio", icon: Home, href: "/dashboard" },
  {
    id: "active" as const,
    label: "Trabajo Activo",
    icon: Wrench,
    href: "/dashboard/active",
  },
  {
    id: "history" as const,
    label: "Mi Historial",
    icon: History,
    href: "/dashboard/history",
  },
];

export function AppSidebar({ currentView }: AppSidebarProps) {
  const { user } = useUser();
  const userFullName = user?.fullName || "Usuario";
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || "";
  const userInitials = userFullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-700 bg-slate-950 text-white fixed left-0 top-0">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700 px-4">
        <span className="text-4xl font-semibold tracking-tight text-white">
          <a href="/">FixNow</a>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#04395E] text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-700 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-800">
              <Avatar className="size-9">
                <AvatarImage src={user?.imageUrl} alt={userFullName} />
                <AvatarFallback className="bg-amber-400 text-slate-950 font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {userFullName}
                </p>
                <p className="truncate text-xs text-slate-400">{userEmail}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 bg-slate-800 border-slate-700"
          >
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/profile"
                className="flex cursor-pointer items-center text-white hover:bg-slate-700"
              >
                <User className="mr-2 size-4" />
                Mi Perfil
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem asChild>
              <SignOutButton redirectUrl="/">
                <span className="flex cursor-pointer items-center text-amber-400 hover:text-amber-300">
                  <LogOut className="mr-2 size-4 text-amber-400 hover:text-amber-300" />
                  <p className="text-amber-400 hover:text-amber-300">
                    Cerrar Sesión
                  </p>
                </span>
              </SignOutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

export default AppSidebar;
