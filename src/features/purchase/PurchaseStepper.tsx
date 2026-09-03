import type { PurchaseStep } from '../../state/purchase/purchase.reducer'
import styles from './PurchaseStepper.module.css'

const STEPS: { step: PurchaseStep; label: string }[] = [
  { step: 'step-1-select-event', label: 'Select Event' },
  { step: 'step-2-your-details', label: 'Your Details' },
  { step: 'step-3-select-seat', label: 'Select Seat' },
  { step: 'step-4-payment', label: 'Payment' },
  { step: 'step-5-confirmation', label: 'Confirmation' },
]

interface PurchaseStepperProps {
  currentStep: PurchaseStep
}

/**
 * Header del stepper — siempre visible, muestra el paso actual y el estado
 * de completado (Context.md 5.4). Presentación pura: recibe el paso actual
 * como dato, no lee la slice `purchase` directamente.
 */
export const PurchaseStepper = ({ currentStep }: PurchaseStepperProps) => {
  const currentIndex = STEPS.findIndex(({ step }) => step === currentStep)

  return (
    <ol className={styles.stepper}>
      {STEPS.map(({ step, label }, index) => {
        const isCurrent = index === currentIndex
        const isCompleted = index < currentIndex
        const className = [
          styles.step,
          isCurrent && styles.stepCurrent,
          isCompleted && styles.stepCompleted,
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <li
            key={step}
            className={className}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className={styles.marker}>{isCompleted ? '✓' : index + 1}</span>
            <span className={styles.label}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
