import { formatCurrency } from '../../utils/formatCurrency'
import styles from './BalanceTag.module.css'

export default function BalanceTag({ amount }) {
  if (!amount || Math.abs(amount) < 0.01) {
    return <span className={`${styles.tag} ${styles.neutral}`}>settled up</span>
  }
  if (amount > 0) {
    return <span className={`${styles.tag} ${styles.pos}`}>owes you {formatCurrency(amount)}</span>
  }
  return <span className={`${styles.tag} ${styles.neg}`}>you owe {formatCurrency(Math.abs(amount))}</span>
}
