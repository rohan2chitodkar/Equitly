import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import AddExpenseModal from '../components/expenses/AddExpenseModal'
import { formatCurrency } from '../utils/formatCurrency'
import toast from 'react-hot-toast'
import styles from './AllExpenses.module.css'

const CATEGORY_EMOJI = {
    food: '🍔', travel: '✈️',
    housing: '🏠', entertainment: '🎬',
    shopping: '🛍️', utilities: '💡',
    health: '🏥', other: '📌'
}

const CATEGORY_COLORS = {
    food: '#fef5e6', travel: '#e8f4fd',
    housing: '#f0fdf4', entertainment: '#fdf4ff',
    shopping: '#fdeee9', utilities: '#fef9e6',
    health: '#e6f4ed', other: '#f5f4f0'
}

export default function AllExpenses() {
    const { user } = useAuth()
    const {
        expenses,
        groups,
        friends,
        fetchExpenses,
        updateExpense,
        deleteExpense
    } = useApp()

    const location = useLocation()
    const [editing, setEditing] = useState(null)
    const [deletingId, setDeletingId] = useState(null)

    useEffect(() => {
        fetchExpenses()
    }, [location.key])

    // ── Group by month ──
    const groupByMonth = (list) => {
        const grouped = {}
        list.forEach(e => {
            const date = new Date(e.createdAt)
            const key = date.toLocaleDateString(
                'en-IN', {
                    month: 'long',
                    year: 'numeric'
                }).toUpperCase()
            if (!grouped[key]) grouped[key] = []
            grouped[key].push(e)
        })
        return grouped
    }

    const handleDelete = async (expenseId) => {
        if (!window.confirm(
                'Delete this expense?')) return
        setDeletingId(expenseId)
        try {
            await deleteExpense(expenseId)
            toast.success('Expense deleted!')
            await fetchExpenses()
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Failed to delete expense'
            )
        } finally {
            setDeletingId(null)
        }
    }

    const handleUpdate = async (payload) => {
        await updateExpense(editing.id, payload)
        setEditing(null)
        await fetchExpenses()
        toast.success('Expense updated!')
    }

    // ── Can this user modify the expense ──
    const canModify = (expense) => {
        const myId = String(user?.id || '')
        return (
            String(expense.createdBy?.id || '')
                === myId ||
            String(expense.paidBy?.id || '')
                === myId
        )
    }

    // ── Get split role ──
    const getRole = (expense) => {
        const myId = String(user?.id || '')
        const paidByMe =
            String(expense.paidBy?.id || '')
                === myId
        const total = parseFloat(
            expense.amount || 0)
        const mySplit = expense.splits?.find(s =>
            String(s.userId || '') === myId ||
            String(s.user?.id || '') === myId
        )
        const myShare = parseFloat(
            mySplit?.amount || 0)

        if (paidByMe) {
            const lent = total - myShare
            if (lent > 0.01) return {
                label: 'you lent',
                amount: formatCurrency(lent),
                type: 'lent'
            }
            return { label: '', amount: '',
                type: 'neutral' }
        } else if (myShare > 0.01) {
            return {
                label: 'you borrowed',
                amount: formatCurrency(myShare),
                type: 'borrowed'
            }
        }
        return { label: '', amount: '',
            type: 'neutral' }
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        return {
            day: date.getDate(),
            month: date.toLocaleDateString(
                'en-IN', { month: 'short' }
            ).toUpperCase()
        }
    }

    // ── All friends and group members ──
    const allFriends = (() => {
        const map = new Map()
        friends?.forEach(f => {
            if (f.id !== user?.id)
                map.set(f.id, f)
        })
        groups?.forEach(g => {
            g.members?.forEach(m => {
                if (m.id !== user?.id &&
                        !map.has(m.id))
                    map.set(m.id, m)
            })
        })
        return Array.from(map.values())
    })()

    const list = Array.isArray(expenses)
        ? expenses : []
    const grouped = groupByMonth(list)

    return (
        <div className={styles.page}>

            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>
                    All Expenses
                </h1>
                <span className={styles.count}>
                    {list.length} total
                </span>
            </div>

            {list.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>
                        🧾
                    </div>
                    <p className={styles.emptyTitle}>
                        No expenses yet
                    </p>
                    <p className={styles.emptySub}>
                        Add your first expense to
                        get started!
                    </p>
                </div>
            ) : (
                Object.entries(grouped).map(
                    ([month, items]) => (
                    <div key={month}>

                        {/* Month header */}
                        <div className={
                            styles.monthHeader}>
                            {month}
                        </div>

                        <div className={styles.card}>
                            {items.map((e, idx) => {
                                const { day, month: mon }
                                    = formatDate(
                                        e.createdAt)
                                const role = getRole(e)
                                const emoji =
                                    CATEGORY_EMOJI[
                                        e.category
                                    ] || '📌'
                                const bg =
                                    CATEGORY_COLORS[
                                        e.category
                                    ] || '#f5f4f0'
                                const canEdit =
                                    canModify(e)

                                return (
                                    <div
                                        key={e.id}
                                        className={`${styles.row} ${idx < items.length - 1
                                            ? styles.rowBorder
                                            : ''}`}
                                    >
                                        {/* Date */}
                                        <div className={
                                            styles.date}>
                                            <span className={
                                                styles.mon}>
                                                {mon}
                                            </span>
                                            <span className={
                                                styles.day}>
                                                {day}
                                            </span>
                                        </div>

                                        {/* Icon */}
                                        <div
                                            className={
                                                styles.icon}
                                            style={{
                                                background:
                                                    bg
                                            }}
                                        >
                                            {emoji}
                                        </div>

                                        {/* Info */}
                                        <div className={
                                            styles.info}>
                                            <div className={
                                                styles.name}>
                                                {e.description}
                                            </div>
                                            <div className={
                                                styles.meta}>
                                                {e.paidBy?.id
                                                === user?.id
                                                    ? 'you'
                                                    : e.paidBy
                                                        ?.name
                                                } paid{' '}
                                                {formatCurrency(
                                                    e.amount)}
                                                {e.group &&
                                                ` · ${e.group.name}`}
                                            </div>
                                        </div>

                                        {/* Role */}
                                        {role.type !==
                                            'neutral' && (
                                            <div className={
                                                styles.role}>
                                                <div className={
                                                    role.type
                                                    === 'lent'
                                                        ? styles.lent
                                                        : styles
                                                            .borrowed
                                                }>
                                                    {role.label}
                                                </div>
                                                <div className={
                                                    role.type
                                                    === 'lent'
                                                        ? styles
                                                            .lentAmt
                                                        : styles
                                                            .borrowedAmt
                                                }>
                                                    {role.amount}
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {canEdit && (
                                            <div className={
                                                styles.actions}>
                                                <button
                                                    className={
                                                        styles
                                                        .actionBtn}
                                                    onClick={() =>
                                                        setEditing(e)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                    onClick={() =>
                                                        handleDelete(
                                                            e.id)}
                                                    disabled={
                                                        deletingId
                                                        === e.id}
                                                    title="Delete"
                                                >
                                                    {deletingId
                                                        === e.id
                                                        ? '...'
                                                        : '🗑️'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))
            )}

            {/* Edit Modal */}
            {editing && (
                <AddExpenseModal
                    expense={editing}
                    onClose={() => setEditing(null)}
                    onSave={handleUpdate}
                    friends={allFriends}
                    groups={groups || []}
                />
            )}
        </div>
    )
}