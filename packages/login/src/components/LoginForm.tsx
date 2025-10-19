import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, Lock, ShieldCheck } from "lucide-react"

import { Button } from "./ui/Button"
import { Input, InputPassword } from "./ui/Input"
import { Label, FieldMessage } from "./ui/Label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/Card"

type Role = "admin" | "voter"
type User = { email: string; password: string; role: Role }

const loginSchema = z.object({
  email: z.string().email({ message: "Ingresa un correo válido." }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres." }),
  accessCode: z.string().optional(),
  remember: z.boolean().optional(),
})
type LoginFormValues = z.infer<typeof loginSchema>

const PUBLIC_BASE = import.meta.env.VITE_PUBLIC_BASE ?? "http://localhost:5176"
const ADMIN_BASE = import.meta.env.VITE_ADMIN_BASE ?? "http://localhost:5175"

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const [formError, setFormError] = React.useState<string | null>(null)
  const remember = watch("remember")

  const onSubmit = async (data: LoginFormValues) => {
    setFormError(null);
    try {
      // 🔹 Llamar al backend real (vote-server)
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: data.email, 
          password: data.password,
          accessCode: data.accessCode || undefined
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Credenciales inválidas");
      }

      // 🔹 Respuesta del servidor
      const { role, email, hasVoted, sessionToken, expiresAt } = await res.json();

      // 🔹 Crear datos de sesión para pasar por URL
      const sessionData = {
        email,
        role,
        hasVoted,
        password: data.password,
        accessCode: data.accessCode,
        sessionToken,
        expiresAt,
        remember: remember
      };

      // 🔹 Guardar sesión en el storage local también por si acaso
      const payload = JSON.stringify(sessionData);
      if (remember) localStorage.setItem("session", payload);
      else sessionStorage.setItem("session", payload);

      // 🔹 Redirigir según el rol, pasando datos por URL
      const PUBLIC_BASE = import.meta.env.VITE_PUBLIC_BASE ?? "http://localhost:5176";
      const ADMIN_BASE = import.meta.env.VITE_ADMIN_BASE ?? "http://localhost:5175";

      if (role === "voter") {
        // Codificar los datos de sesión como parámetros URL
        const urlParams = new URLSearchParams({
          sessionData: btoa(JSON.stringify(sessionData)) // Codificar en base64
        });
        window.location.replace(`${PUBLIC_BASE}/?${urlParams.toString()}`);
      } else {
        // También pasar datos de sesión al admin por URL
        const urlParams = new URLSearchParams({
          sessionData: btoa(JSON.stringify(sessionData)) // Codificar en base64
        });
        window.location.replace(`${ADMIN_BASE}/?${urlParams.toString()}`);
      }
    } catch (e: any) {
      setFormError(e?.message ?? "Error inesperado");
    }
  };


  return (
    <Card interactive className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <span className="text-xs text-muted-foreground">Sistema de Votaciones</span>
        </div>
        <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
        <CardDescription>Accede con tu correo institucional para continuar.</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="grid gap-4">
          {/* Email */}
          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              leftIcon={<Mail className="h-4 w-4" />}
              status={errors.email ? "error" : "default"}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            <FieldMessage id="email-error" tone={errors.email ? "error" : "default"}>
              {errors.email?.message}
            </FieldMessage>
          </div>

          {/* Password */}
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <InputPassword
              id="password"
              leftIcon={<Lock className="h-4 w-4" />}
              status={errors.password ? "error" : "default"}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <FieldMessage id="password-error" tone={errors.password ? "error" : "default"}>
              {errors.password?.message}
            </FieldMessage>
          </div>
          
          {/* Access Code */}
          <div className="grid gap-2">
            <Label htmlFor="accessCode">Código de Acceso (opcional)</Label>
            <Input
              id="accessCode"
              type="text"
              placeholder="123456"
              leftIcon={<ShieldCheck className="h-4 w-4" />}
              status={errors.accessCode ? "error" : "default"}
              aria-describedby={errors.accessCode ? "accessCode-error" : undefined}
              {...register("accessCode")}
            />
            <FieldMessage id="accessCode-error" tone={errors.accessCode ? "error" : "default"}>
              {errors.accessCode?.message}
            </FieldMessage>
            <p className="text-xs text-muted-foreground">
              🔒 Ingresa tu código de 6 dígitos si tienes uno para mayor seguridad
            </p>
          </div>

          {/* Remember me */}
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-input accent-foreground" {...register("remember")} />
            Recordarme en este dispositivo
          </label>

          {/* Error general */}
          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" variant="gradient" fullWidth loading={isSubmitting}>
            Ingresar
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Al continuar aceptas nuestros términos y políticas.
          </p>
          <div className="text-xs text-muted-foreground text-center">
            <p><strong>Demo:</strong> admin@demo.com / 123456 (admin)</p>
            <p>votante@demo.com / 123456 (voter)</p>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
