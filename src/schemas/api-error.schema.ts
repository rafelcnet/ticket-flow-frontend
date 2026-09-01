import { z } from 'zod'

/** Forma común de error de todo el proyecto (SpecHttp 5, "Error shape (all errors)"). */
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
})

export type ApiErrorShape = z.infer<typeof ApiErrorSchema>
