import type { User } from '../../schemas/user.schema'

/** Slice `auth` (Context.md 8.4, SpecState 2.1) — campos sin cambios. */
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

export const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
}

/** FSM de la slice `auth` (SpecState 2.2, Context.md 6.1). */
export type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User } }
  | { type: 'LOGOUT' }
  | { type: 'SESSION_EXPIRED' }

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { user: action.payload.user, isAuthenticated: true }
    case 'LOGOUT':
    case 'SESSION_EXPIRED':
      return { user: null, isAuthenticated: false }
    default:
      return state
  }
}
