import { z } from 'zod'
import { UserSchema } from './user.schema'

/**
 * `POST /auth/login` — request body (SpecHttp 7.2).
 * `min(1)` es la única fuente de verdad para "campos requeridos" (SpecAuth
 * 2.1) — el formulario no duplica esta validación por su cuenta.
 */
export const LoginRequestSchema = z.object({
  email: z.string().min(1, 'El correo es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export type LoginRequest = z.infer<typeof LoginRequestSchema>

/** `POST /auth/login` — 200 OK (SpecHttp 7.2). */
export const LoginResponseSchema = z.object({
  token: z.string(),
  user: UserSchema,
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>

/** `POST /auth/logout` — 200 OK (SpecHttp 7.3). */
export const LogoutResponseSchema = z.object({
  message: z.string(),
})

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>
