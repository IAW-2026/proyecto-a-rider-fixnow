"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  MapPin,
  Phone,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";

interface ProfileClientViewProps {
  initialAddress: string;
  initialPhone: string;
}

export function ProfileClientView({
  initialAddress,
  initialPhone,
}: ProfileClientViewProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [address, setAddress] = useState(initialAddress);
  const [phone, setPhone] = useState(initialPhone);

  // Estados de edición
  const [editingField, setEditingField] = useState<"address" | "phone" | null>(
    null,
  );
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded || !user) {
    return (
      <div className="text-slate-400 flex items-center gap-2">
        <Loader2 className="animate-spin size-5" /> Cargando perfil...
      </div>
    );
  }

  const handleEdit = (field: "address" | "phone", currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
    setError(null);
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue("");
    setError(null);
  };

  const handleSave = async (field: "address" | "phone") => {
    if (!editValue.trim()) {
      setError("El campo no puede estar vacío");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const dataToSave = {
        fullName: user.fullName || "Usuario",
        address: field === "address" ? editValue : address,
        phone: field === "phone" ? editValue : phone,
      };

      const response = await fetch("/api/v1/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) throw new Error("Error al guardar en la base de datos");

      // 3. Guardamos en Clerk
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          [field]: editValue,
        },
      });

      // 4. Actualizamos vista local
      if (field === "address") setAddress(editValue);
      if (field === "phone") setPhone(editValue);

      setEditingField(null);
      router.refresh();
    } catch (err) {
      setError("No se pudo actualizar. Intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className=" max-w-3xl mx-auto">
      <div className="flex flex-col items-center gap-4 text-center border-b border-slate-700 pb-10">
        <img
          src={user.imageUrl}
          alt="Avatar"
          className="size-28 rounded-full object-cover border-4 border-slate-700 shadow-2xl"
        />
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-white">
            {user.fullName}
          </h1>
          <p className="text-base text-amber-400 font-medium mt-1">
            Cliente Miembro FixNow
          </p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-1">
        {/* TARJETA 1: DATOS DE LA CUENTA (Solo Lectura, Diseño Limpio) */}
        <div className="bg-slate-900 rounded-2xl p-7 border border-slate-700 shadow-lg space-y-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2.5">
            <User className="size-5 text-slate-400" /> Datos de la Cuenta
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Nombre Completo
              </span>
              <p className="text-base font-medium text-white">
                {user.fullName}
              </p>
            </div>
            <div className="space-y-1 pt-3 border-t border-slate-800">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Correo Electrónico
              </span>
              <p className="text-base font-medium text-white">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        </div>

        {/* TARJETA 2: INFORMACIÓN DE CONTACTO (Editable, Botones SIEMPRE Visibles) */}
        <div className="bg-slate-900 rounded-2xl p-7 border border-slate-700 shadow-lg space-y-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2.5">
            <Mail className="size-5 text-slate-400" /> Información de Contacto
          </h3>

          <div className="space-y-4">
            {/* CAMPO: DIRECCIÓN */}
            <div className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Dirección de Servicio
              </span>

              {editingField === "address" ? (
                <div className="flex gap-2 pt-1">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 rounded-lg border border-amber-500/50 bg-slate-800 px-3 py-1.5 text-sm text-white outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => handleSave("address")}
                    disabled={isSaving}
                    className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex size-8 items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1 group">
                  <p className="text-base font-medium text-white">{address}</p>
                  {/* FIX: Botón de editar SIEMPRE visible, no solo en hover */}
                  <button
                    onClick={() => handleEdit("address", address)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 p-1.5 rounded-md hover:bg-amber-400/10 transition-colors"
                  >
                    <Pencil className="size-3.5" />
                    Editar
                  </button>
                </div>
              )}
            </div>

            {/* CAMPO: TELÉFONO */}
            <div className="space-y-1 pt-3 border-t border-slate-800">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Número de Teléfono
              </span>

              {editingField === "phone" ? (
                <div className="flex gap-2 pt-1">
                  <input
                    autoFocus
                    type="tel"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 rounded-lg border border-amber-500/50 bg-slate-800 px-3 py-1.5 text-sm text-white outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => handleSave("phone")}
                    disabled={isSaving}
                    className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex size-8 items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <p className="text-base font-medium text-white">{phone}</p>
                  {/* FIX: Botón de editar SIEMPRE visible */}
                  <button
                    onClick={() => handleEdit("phone", phone)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 p-1.5 rounded-md hover:bg-amber-400/10 transition-colors"
                  >
                    <Pencil className="size-3.5" />
                    Editar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 font-medium bg-red-900/20 p-4 rounded-xl border border-red-900/50 max-w-lg mx-auto text-center">
          {error}
        </p>
      )}
    </div>
  );
}
