import { describe, expect, it } from 'vitest'
import {
  PaymentFormSchema,
  formatCardNumber,
  formatCvv,
  formatExpirationDate,
} from './payment-form.schema'

const tarjetaValida = {
  method: 'card' as const,
  cardNumber: '4111 1111 1111 1111',
  expirationDate: '12/28',
  cvv: '123',
  cardholderName: 'Sofía Hernández',
}

/**
 * `flatten().fieldErrors` de una unión discriminada tipa por rama (zod 4) —
 * en los tests siempre se valida el formulario de tarjeta, así que se
 * castea igual que en `PaymentStep.tsx` en vez de repetir un narrowing que
 * no aporta nada a la aserción.
 */
type CardFieldErrors = Partial<
  Record<'cardNumber' | 'expirationDate' | 'cvv' | 'cardholderName', string[] | undefined>
>

const cardFieldErrors = (fieldErrors: unknown) => fieldErrors as CardFieldErrors

describe('PaymentFormSchema', () => {
  it('acepta un formulario de tarjeta con todos los campos válidos (SpecPurchase 3.2)', () => {
    // Given / When: un formulario de tarjeta completo y bien formateado
    const result = PaymentFormSchema.safeParse(tarjetaValida)

    // Then: la validación pasa
    expect(result.success).toBe(true)
  })

  it('acepta un formulario de PayPal sin ningún campo adicional (Context.md 5.4: sin campos que validar)', () => {
    // Given / When: sólo se eligió el método PayPal
    const result = PaymentFormSchema.safeParse({ method: 'paypal' })

    // Then: la validación pasa sin exigir datos de tarjeta
    expect(result.success).toBe(true)
  })

  it('rechaza un número de tarjeta que no tiene el formato XXXX XXXX XXXX XXXX', () => {
    // Given: un número de tarjeta sin el autoformateo esperado
    // When: se valida el formulario
    const result = PaymentFormSchema.safeParse({ ...tarjetaValida, cardNumber: '4111111111111111' })

    // Then: falla con el mensaje de ese campo
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(cardFieldErrors(result.error.flatten().fieldErrors).cardNumber?.[0]).toBe(
        'El número de tarjeta debe tener 16 dígitos',
      )
    }
  })

  it('rechaza una fecha de expiración que no tiene el formato MM/YY', () => {
    // Given: una fecha de expiración con un mes inválido
    // When: se valida el formulario
    const result = PaymentFormSchema.safeParse({ ...tarjetaValida, expirationDate: '13/28' })

    // Then: falla con el mensaje de ese campo
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(cardFieldErrors(result.error.flatten().fieldErrors).expirationDate?.[0]).toBe(
        'La fecha de expiración debe tener el formato MM/YY',
      )
    }
  })

  it('rechaza un CVV que no tiene exactamente 3 dígitos', () => {
    // Given: un CVV de 2 dígitos
    // When: se valida el formulario
    const result = PaymentFormSchema.safeParse({ ...tarjetaValida, cvv: '12' })

    // Then: falla con el mensaje de ese campo
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(cardFieldErrors(result.error.flatten().fieldErrors).cvv?.[0]).toBe(
        'El CVV debe tener 3 dígitos',
      )
    }
  })

  it('rechaza un nombre de titular vacío', () => {
    // Given: el campo del titular sin completar
    // When: se valida el formulario
    const result = PaymentFormSchema.safeParse({ ...tarjetaValida, cardholderName: '' })

    // Then: falla con el mensaje de ese campo
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(cardFieldErrors(result.error.flatten().fieldErrors).cardholderName?.[0]).toBe(
        'El nombre del titular es obligatorio',
      )
    }
  })

  it('reporta todos los campos incompletos a la vez cuando el formulario está vacío (AC: no puedo enviar el pago incompleto)', () => {
    // Given: un formulario de tarjeta sin ningún campo completado
    // When: se valida
    const result = PaymentFormSchema.safeParse({
      method: 'card',
      cardNumber: '',
      expirationDate: '',
      cvv: '',
      cardholderName: '',
    })

    // Then: falla en los cuatro campos
    expect(result.success).toBe(false)
    if (!result.success) {
      const errores = cardFieldErrors(result.error.flatten().fieldErrors)
      expect(errores.cardNumber).toBeDefined()
      expect(errores.expirationDate).toBeDefined()
      expect(errores.cvv).toBeDefined()
      expect(errores.cardholderName).toBeDefined()
    }
  })
})

describe('formatCardNumber', () => {
  it('agrupa los dígitos en bloques de 4 separados por espacio (Context.md 5.4)', () => {
    // Given / When: el usuario escribe el número sin espacios
    const resultado = formatCardNumber('4111111111111111')

    // Then: queda formateado como XXXX XXXX XXXX XXXX
    expect(resultado).toBe('4111 1111 1111 1111')
  })

  it('descarta cualquier caracter que no sea un dígito', () => {
    // Given / When: el usuario pega el número con guiones y letras
    const resultado = formatCardNumber('4111-abcd-1111-1111')

    // Then: sólo quedan los dígitos, agrupados de a 4
    expect(resultado).toBe('4111 1111 1111')
  })

  it('trunca a un máximo de 16 dígitos', () => {
    // Given / When: el usuario escribe más de 16 dígitos
    const resultado = formatCardNumber('411111111111111199999')

    // Then: se ignora todo lo que exceda los 16 dígitos
    expect(resultado).toBe('4111 1111 1111 1111')
  })

  it('devuelve una cadena vacía si no hay ningún dígito', () => {
    // Given / When: el campo está vacío (o el usuario borró todo)
    const resultado = formatCardNumber('')

    // Then: no hay nada que agrupar
    expect(resultado).toBe('')
  })
})

describe('formatExpirationDate', () => {
  it('inserta la barra después de los primeros 2 dígitos (formato MM/YY)', () => {
    // Given / When: el usuario escribe mes y año seguidos
    const resultado = formatExpirationDate('1228')

    // Then: queda formateado como MM/YY
    expect(resultado).toBe('12/28')
  })

  it('no inserta la barra mientras el mes no esté completo', () => {
    // Given / When: el usuario sólo escribió el primer dígito del mes
    const resultado = formatExpirationDate('1')

    // Then: se muestra tal cual, sin barra todavía
    expect(resultado).toBe('1')
  })

  it('trunca a un máximo de 4 dígitos (MMYY)', () => {
    // Given / When: el usuario escribe más de 4 dígitos
    const resultado = formatExpirationDate('122899')

    // Then: se ignora todo lo que exceda MM/YY
    expect(resultado).toBe('12/28')
  })
})

describe('formatCvv', () => {
  it('descarta cualquier caracter que no sea un dígito', () => {
    // Given / When: el usuario escribe algo que no son sólo números
    const resultado = formatCvv('1a2b3')

    // Then: sólo quedan los dígitos
    expect(resultado).toBe('123')
  })

  it('trunca a un máximo de 3 dígitos', () => {
    // Given / When: el usuario escribe más de 3 dígitos
    const resultado = formatCvv('12345')

    // Then: se ignora todo lo que exceda los 3 dígitos
    expect(resultado).toBe('123')
  })
})
