import { UserSchema, type User } from '../schemas/user.schema'
import { httpClient } from '../http/http.client'

/** `GET /users/me` (SpecHttp 7.4) — perfil autenticado. */
export const getProfile = async (): Promise<User> => {
  const response = await httpClient.get<User>('/users/me')
  return UserSchema.parse(response)
}
