import type { Zone } from '../../../schemas/seat-map.schema'
import styles from './SeatMap.module.css'

interface ZoneLegendProps {
  zones: Zone[]
}

/** Leyenda de zonas — debajo del mapa: nombre, color y precio (Context.md 5.4, SpecSeatMap 3). */
export const ZoneLegend = ({ zones }: ZoneLegendProps) => (
  <ul className={styles.legend}>
    {zones.map((zone) => (
      <li key={zone.id} className={styles.legendItem}>
        <span className={styles.legendDot} style={{ backgroundColor: zone.color }} />
        {zone.name} — ${zone.price.toFixed(2)}
      </li>
    ))}
  </ul>
)
