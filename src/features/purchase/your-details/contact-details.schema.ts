import { z } from 'zod'

/**
 * Paso 2 — Tus Datos (SpecPurchase 3.1, Context.md 5.4).
 * Validación puramente de cliente: no corresponde a ningún endpoint del
 * contrato (por eso vive junto a la feature, no en `schemas/`, reservado a
 * un esquema por recurso del Postman collection — SpecProject 3.4).
 */
export const ContactDetailsSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  email: z.string().min(1, 'El correo es obligatorio'),
  phone: z.string().min(1, 'El teléfono es obligatorio'),
})

export type ContactDetails = z.infer<typeof ContactDetailsSchema>
