import { useState, type FormEvent } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { usePurchase } from '../../../hooks/usePurchase'
import { ContactDetailsSchema, type ContactDetails } from './contact-details.schema'
import styles from './YourDetailsStep.module.css'

type FieldErrors = Partial<Record<keyof ContactDetails, string>>

const EMPTY_DETAILS: ContactDetails = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
}

/**
 * Paso 2 — Tus Datos (Context.md 5.4, SpecPurchase 2.1/3.1).
 * Prellena desde la slice `purchase` si el usuario ya los confirmó antes
 * (persistencia entre pasos, GO_BACK) o, si no, desde el perfil ya
 * disponible en la slice `auth` (Context.md 5.4: "o usar datos cacheados
 * desde la respuesta de login") — sin una segunda llamada a `GET /users/me`.
 */
export const YourDetailsStep = () => {
  const { state: authState } = useAuth()
  const { state, dispatch } = usePurchase()

  const [details, setDetails] = useState<ContactDetails>(
    state.contactDetails ??
      (authState.user
        ? {
            firstName: authState.user.name,
            lastName: authState.user.lastname,
            email: authState.user.email,
            phone: authState.user.phone,
          }
        : EMPTY_DETAILS),
  )
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const handleChange = (field: keyof ContactDetails, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = ContactDetailsSchema.safeParse(details)
    if (!result.success) {
      const issues = result.error.flatten().fieldErrors
      setFieldErrors({
        firstName: issues.firstName?.[0],
        lastName: issues.lastName?.[0],
        email: issues.email?.[0],
        phone: issues.phone?.[0],
      })
      return
    }
    setFieldErrors({})
    dispatch({ type: 'CONFIRM_DETAILS', payload: { contactDetails: result.data } })
  }

  const field = (name: keyof ContactDetails, label: string) => (
    <div className={styles.field}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        value={details[name]}
        onChange={(event) => handleChange(name, event.target.value)}
        aria-invalid={Boolean(fieldErrors[name])}
        aria-describedby={fieldErrors[name] ? `${name}-error` : undefined}
      />
      {fieldErrors[name] && (
        <p id={`${name}-error`} className={styles.fieldError}>
          {fieldErrors[name]}
        </p>
      )}
    </div>
  )

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {field('firstName', 'First name')}
      {field('lastName', 'Last name')}
      {field('email', 'Email')}
      {field('phone', 'Phone')}

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.back}
          onClick={() => dispatch({ type: 'GO_BACK' })}
        >
          Back
        </button>
        <button type="submit" className={styles.next}>
          Next
        </button>
      </div>
    </form>
  )
}
