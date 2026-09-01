import { z } from 'zod'

/** `GET /users/me` (SpecHttp 7.4). */
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  lastname: z.string(),
  email: z.email(),
  phone: z.string(),
})

export type User = z.infer<typeof UserSchema>
