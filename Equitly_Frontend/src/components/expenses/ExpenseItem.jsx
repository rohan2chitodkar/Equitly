import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ReceiptMpdal } from './ReceiptModal'
import {
    formatCurrency,
    CATEGORY_EMOJI,
    CATEGORY_COLORS
} from '../../utils/formatCurrency'
import styles from './ExpenseItem.module.css'

export default function ExpenseItem({
    expense,
    onEdit,
    onDelete,
    onUpdate
}) {
    const { user } = useAuth()
    const myId = String(user?.id || '')

    // ── Check if current user can edit/delete ──
    const canModify =
        String(expense.createdBy?.id || '')
            === myId ||
        String(expense.paidBy?.id || '')
            === myId

    // ── Split label ──
    const paidByMe =
        String(expense.paidBy?.id || '') === myId
    const total = parseFloat(expense.amount || 0)

    const mySplit = expense.splits?.find(s =>
        String(s.userId || '') === myId ||
        String(s.user?.id || '') === myId
    )
    const myShare = parseFloat(
        mySplit?.amount || 0)

    let splitLabel = ''
    let splitType = 'neutral'
    let splitAmount = ''

    if (paidByMe) {
        const lent = total - myShare
        if (lent > 0.01) {
            splitLabel = 'you lent'
            splitType = 'lent'
            splitAmount = formatCurrency(lent)
        }
    } else if (myShare > 0.01) {
        splitLabel = 'you borrowed'
        splitType = 'borrowed'
        splitAmount = formatCurrency(myShare)
    }

    const emoji = CATEGORY_EMOJI[
        expense.category] || '📌'
    const bg = CATEGORY_COLORS[
        expense.category] || '#f5f4f0'

    return (
        <>
            <div className={styles.item}>

                {/* Category icon */}
                <div
                    className={styles.icon}
                    style={{ background: bg }}
                >
                    {emoji}
                </div>

                {/* Info */}
                <div className={styles.info}>
                    <div className={styles.title}>
                        {expense.description}
                    </div>
                    <div className={styles.meta}>
                        {expense.paidBy?.id === user?.id
                            ? 'you'
                            : expense.paidBy?.name
                        } paid{' '}
                        {formatCurrency(expense.amount)}
                    </div>
                </div>

                {/* Split label */}
                <div className={styles.split}>
                    {splitType !== 'neutral' && (
                        <>
                            <div className={
                                splitType === 'lent'
                                    ? styles.lentLabel
                                    : styles.borrowedLabel
                            }>
                                {splitLabel}
                            </div>
                            <div className={
                                splitType === 'lent'
                                    ? styles.lentAmt
                                    : styles.borrowedAmt
                            }>
                                {splitAmount}
                            </div>
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    {/* Edit — only for creator/payer */}
                    {canModify && onEdit && (
                        <button
                            className={styles.actionBtn}
                            onClick={() =>
                                onEdit(expense)}
                            title="Edit expense"
                        >
                            ✏️
                        </button>
                    )}

                    {/* Delete — only for creator/payer */}
                    {canModify && onDelete && (
                        <button
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            onClick={() =>
                                onDelete(expense.id)}
                            title="Delete expense"
                        >
                            🗑️
                        </button>
                    )}
                </div>
            </div>
        </>
    )
}