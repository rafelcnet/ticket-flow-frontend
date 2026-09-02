import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ApiError } from '../../http/http.types'
import { ROUTES } from '../../routes/routes.config'
import { LoginRequestSchema } from '../../schemas/auth.schema'
import { login } from '../../services/auth.service'
import styles from './LoginPage.module.css'

const GENERIC_ERROR_MESSAGE = 'No se pudo iniciar sesión. Inténtalo de nuevo.'

interface FieldErrors {
  email?: string
  password?: string
}

/**
 * Pantalla 1 — Login (`/login`, Context.md 5.2, SpecAuth 2).
 * "Create account" y "Forgot your password?" son `// TODO` (Context.md 9) —
 * deshabilitados con badge "Soon", sin backend detrás.
 */
export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { dispatch } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const result = LoginRequestSchema.safeParse({ email, password })
    if (!result.success) {
      const issues = result.error.flatten().fieldErrors
      setFieldErrors({ email: issues.email?.[0], password: issues.password?.[0] })
      return
    }
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      const { user } = await login(result.data)
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user } })
      navigate(ROUTES.home)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : GENERIC_ERROR_MESSAGE)
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <h1 className={styles.wordmark}>
          Ticket<span className={styles.wordmarkAccent}>Flow</span>
        </h1>

        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="text"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          />
          {fieldErrors.email && (
            <p id="email-error" className={styles.fieldError}>
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <div className={styles.passwordRow}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="password-error" className={styles.fieldError}>
              {fieldErrors.password}
            </p>
          )}
        </div>

        {formError && (
          <p role="alert" className={styles.formError}>
            {formError}
          </p>
        )}

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>

        <div className={styles.divider} />

        <button type="button" className={styles.secondary} disabled>
          Create account
          <span className={styles.badge}>Soon</span>
        </button>
        <span className={styles.link}>
          Forgot your password?
          <span className={styles.badge}>Soon</span>
        </span>
      </form>
    </div>
  )
}
