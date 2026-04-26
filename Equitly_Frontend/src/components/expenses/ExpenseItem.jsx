import { useAuth } from '../../context/AuthContext'
import { formatCurrency, formatDate, CATEGORY_EMOJI, CATEGORY_COLORS } from '../../utils/formatCurrency'
import styles from './ExpenseItem.module.css'

export default function ExpenseItem({ expense, onEdit, onDelete }) {
  const { user } = useAuth()

  const myId = user?.id
  const paidByMe = expense.paidBy?.id === myId
  const mySplit = expense.splits?.find(s =>
    s.userId === myId || s.user?.id === myId
  )
  const myShare = mySplit?.amount || 0
  const totalPaid = expense.amount

  let splitLabel = ''
  let splitClass = styles.neutral
  if (paidByMe && myShare < totalPaid) {
    const owed = totalPaid - myShare
    splitLabel = `you lent ${formatCurrency(owed)}`
    splitClass = styles.pos
  } else if (!paidByMe && myShare > 0) {
    splitLabel = `you owe ${formatCurrency(myShare)}`
    splitClass = styles.neg
  } else if (paidByMe && myShare === totalPaid) {
    splitLabel = 'not involved'
    splitClass = styles.neutral
  } else {
    splitLabel = 'you paid'
    splitClass = styles.pos
  }

  const emoji = CATEGORY_EMOJI[expense.category] || '📌'
  const bg = CATEGORY_COLORS[expense.category] || '#f5f4f0'

  return (
    <div className={styles.item}>
      <div className={styles.icon} style={{ background: bg }}>{emoji}</div>
      <div className={styles.info}>
        <div className={styles.title}>{expense.description}</div>
        <div className={styles.meta}>
          {expense.paidBy?.name} · {formatDate(expense.createdAt)}
          {expense.group && ` · ${expense.group.name}`}
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.total}>{formatCurrency(expense.amount)}</div>
        <div className={`${styles.split} ${splitClass}`}>{splitLabel}</div>
      </div>
      {(onEdit || onDelete) && (
        <div className={styles.actions}>
          {onEdit && <button className={styles.actionBtn} onClick={() => onEdit(expense)} title="Edit">✏️</button>}
          {onDelete && <button className={styles.actionBtn} onClick={() => onDelete(expense.id)} title="Delete">🗑️</button>}
        </div>
      )}
    </div>
  )
}
