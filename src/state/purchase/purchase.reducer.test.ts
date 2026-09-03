import { describe, expect, it } from 'vitest'
import {
  initialPurchaseState,
  purchaseReducer,
  type PurchaseAction,
} from './purchase.reducer'

const evento = {
  id: 'evt-001',
  venueId: 'ven-001',
  name: 'Bad Liebre',
  date: '2025-02-15',
  time: '21:00',
  location: 'Ciudad de México, México',
  imageUrl: 'https://raw.githubusercontent.com/.../bad-liebre.png',
  basePrice: 150,
  currency: 'USD' as const,
}

const datosDeContacto = {
  firstName: 'Sofía',
  lastName: 'Hernández',
  email: 'sofia.hernandez@ticketflow.com',
  phone: '+525511223344',
}

describe('purchaseReducer', () => {
  it('el estado inicial arranca en el Paso 1, sin ningún dato capturado', () => {
    // Given / When: el estado inicial de la slice purchase (SpecPurchase 1)
    // Then: no hay evento, datos de contacto, asiento ni pago aún
    expect(initialPurchaseState).toEqual({
      currentStep: 'step-1-select-event',
      selectedEvent: null,
      contactDetails: null,
      selectedSeat: null,
      paymentResult: null,
    })
  })

  it('SELECT_EVENT guarda el evento elegido y avanza al Paso 2 (SpecPurchase 2.1)', () => {
    // Given: el usuario está en el Paso 1
    // When: se despacha SELECT_EVENT
    const result = purchaseReducer(initialPurchaseState, {
      type: 'SELECT_EVENT',
      payload: { event: evento },
    })

    // Then: el evento queda guardado y el paso avanza
    expect(result.selectedEvent).toEqual(evento)
    expect(result.currentStep).toBe('step-2-your-details')
  })

  it('CONFIRM_DETAILS guarda los datos de contacto y avanza al Paso 3', () => {
    // Given: el usuario ya eligió un evento y está en el Paso 2
    const estadoEnPaso2 = purchaseReducer(initialPurchaseState, {
      type: 'SELECT_EVENT',
      payload: { event: evento },
    })

    // When: se despacha CONFIRM_DETAILS
    const result = purchaseReducer(estadoEnPaso2, {
      type: 'CONFIRM_DETAILS',
      payload: { contactDetails: datosDeContacto },
    })

    // Then: los datos de contacto quedan guardados y el paso avanza
    expect(result.contactDetails).toEqual(datosDeContacto)
    expect(result.currentStep).toBe('step-3-select-seat')
    // Y el evento seleccionado se conserva (persistencia entre pasos)
    expect(result.selectedEvent).toEqual(evento)
  })

  it('GO_BACK desde el Paso 2 vuelve al Paso 1, conservando el evento elegido', () => {
    // Given: el usuario está en el Paso 2
    const estadoEnPaso2 = purchaseReducer(initialPurchaseState, {
      type: 'SELECT_EVENT',
      payload: { event: evento },
    })

    // When: se despacha GO_BACK
    const result = purchaseReducer(estadoEnPaso2, { type: 'GO_BACK' })

    // Then: vuelve al Paso 1 sin perder el evento ya elegido
    expect(result.currentStep).toBe('step-1-select-event')
    expect(result.selectedEvent).toEqual(evento)
  })

  it('GO_BACK desde el Paso 3 vuelve al Paso 2, conservando los datos de contacto', () => {
    // Given: el usuario avanzó hasta el Paso 3
    let estado = purchaseReducer(initialPurchaseState, {
      type: 'SELECT_EVENT',
      payload: { event: evento },
    })
    estado = purchaseReducer(estado, {
      type: 'CONFIRM_DETAILS',
      payload: { contactDetails: datosDeContacto },
    })

    // When: se despacha GO_BACK
    const result = purchaseReducer(estado, { type: 'GO_BACK' })

    // Then: vuelve al Paso 2 sin perder los datos de contacto ya confirmados
    expect(result.currentStep).toBe('step-2-your-details')
    expect(result.contactDetails).toEqual(datosDeContacto)
  })

  it('SELECT_SEAT guarda el asiento ya resuelto (zona/precio) y avanza al Paso 4 (SpecPurchase 2.1/4.3)', () => {
    // Given: el usuario avanzó hasta el Paso 3
    let estado = purchaseReducer(initialPurchaseState, {
      type: 'SELECT_EVENT',
      payload: { event: evento },
    })
    estado = purchaseReducer(estado, {
      type: 'CONFIRM_DETAILS',
      payload: { contactDetails: datosDeContacto },
    })

    // When: se despacha SELECT_SEAT con la zona ya resuelta
    const asientoResuelto = {
      seatId: 'sea-002',
      row: 1,
      col: 2,
      zoneName: 'VIP',
      zonePrice: 150,
    }
    const result = purchaseReducer(estado, {
      type: 'SELECT_SEAT',
      payload: { seat: asientoResuelto },
    })

    // Then: el asiento queda guardado y el paso avanza a Payment
    expect(result.selectedSeat).toEqual(asientoResuelto)
    expect(result.currentStep).toBe('step-4-payment')
    // Y los datos de los pasos anteriores se conservan
    expect(result.selectedEvent).toEqual(evento)
    expect(result.contactDetails).toEqual(datosDeContacto)
  })

  it('GO_BACK desde el Paso 4 vuelve al Paso 3, conservando el asiento elegido', () => {
    // Given: el usuario avanzó hasta el Paso 4
    let estado = purchaseReducer(initialPurchaseState, {
      type: 'SELECT_EVENT',
      payload: { event: evento },
    })
    estado = purchaseReducer(estado, {
      type: 'CONFIRM_DETAILS',
      payload: { contactDetails: datosDeContacto },
    })
    const asientoResuelto = {
      seatId: 'sea-002',
      row: 1,
      col: 2,
      zoneName: 'VIP',
      zonePrice: 150,
    }
    estado = purchaseReducer(estado, {
      type: 'SELECT_SEAT',
      payload: { seat: asientoResuelto },
    })

    // When: se despacha GO_BACK
    const result = purchaseReducer(estado, { type: 'GO_BACK' })

    // Then: vuelve al Paso 3 sin perder el asiento ya elegido
    expect(result.currentStep).toBe('step-3-select-seat')
    expect(result.selectedSeat).toEqual(asientoResuelto)
  })

  it('GO_BACK en el Paso 1 no tiene ningún efecto — no hay paso anterior', () => {
    // Given: el usuario está en el primer paso
    // When: se despacha GO_BACK de todas formas
    const result = purchaseReducer(initialPurchaseState, { type: 'GO_BACK' })

    // Then: el estado no cambia
    expect(result.currentStep).toBe('step-1-select-event')
  })

  it('ignora una acción desconocida y devuelve el mismo estado', () => {
    // Given: un estado cualquiera
    const accionDesconocida = { type: 'ACCION_INEXISTENTE' } as unknown as PurchaseAction

    // When: se despacha una acción fuera de la FSM implementada en TF-5
    const result = purchaseReducer(initialPurchaseState, accionDesconocida)

    // Then: el estado no cambia
    expect(result).toBe(initialPurchaseState)
  })
})
