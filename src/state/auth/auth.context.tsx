import { createContext, useReducer, type Dispatch, type ReactNode } from 'react'
import {
  authReducer,
  initialAuthState,
  type AuthAction,
  type AuthState,
} from './auth.reducer'

export interface AuthContextValue {
  state: AuthState
  dispatch: Dispatch<AuthAction>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** Provider de la slice `auth` (Context API + useReducer, SpecProject 0/3.6). */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)
  return <AuthContext value={{ state, dispatch }}>{children}</AuthContext>
}
