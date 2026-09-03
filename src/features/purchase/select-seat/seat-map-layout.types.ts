import type { Seat, Zone } from '../../../schemas/seat-map.schema'

/**
 * Props compartidas por los tres layouts `SeatMap<VenueType>`
 * (`SpecProject 3.3`, `SpecSeatMap` 1) — presentación pura, sin fetch ni
 * acceso a la slice: reciben datos ya cargados y notifican el click.
 */
export interface SeatMapLayoutProps {
  seats: Seat[]
  zones: Zone[]
  selectedSeatId: string | null
  onSeatClick: (seatId: string) => void
}
