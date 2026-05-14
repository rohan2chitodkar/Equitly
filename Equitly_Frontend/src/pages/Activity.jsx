import { useEffect, useState } from 'react'
import { activityApi } from '../api/activityApi'
import styles from './Activity.module.css'
import { useLocation } from 'react-router-dom'

const TYPE_CONFIG = {
    EXPENSE_ADDED:   { icon: '🛒', bg: '#f0fdf4' },
    EXPENSE_UPDATED: { icon: '✏️', bg: '#fef9e6' },
    EXPENSE_DELETED: { icon: '🗑️', bg: '#fdeee9' },
    GROUP_CREATED:   { icon: '🏠', bg: '#e8f4fd' },
    GROUP_DELETED:   { icon: '❌', bg: '#fdeee9' },
    MEMBER_ADDED:    { icon: '👥', bg: '#fdf4ff' },
    MEMBER_LEFT:     { icon: '🚪', bg: '#fef5e6' },
    SETTLEMENT:      { icon: '💸', bg: '#e6f4ed' },
}

export default function Activity() {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const location = useLocation()

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const data = await activityApi.getAll()
                setActivities(
                    Array.isArray(data) ? data : [])
            } catch {
                setActivities([])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [location.key])

    // ── Format date and time ──
    const formatDateTime = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        const now = new Date()
        const diffDays = Math.floor(
            (now - date) / (1000 * 60 * 60 * 24))

        // Time string
        const time = date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })

        // Date string
        let dateLabel = ''
        if (diffDays === 0) {
            dateLabel = 'Today'
        } else if (diffDays === 1) {
            dateLabel = 'Yesterday'
        } else {
            dateLabel = date.toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !==
                    now.getFullYear()
                        ? 'numeric' : undefined
            })
        }

        return { dateLabel, time }
    }

    // ── Format currency ──
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return ''
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount)
    }

    // ── Get balance tag ──
    const getBalanceTag = (activity) => {
        if (activity.type !== 'EXPENSE_ADDED' &&
            activity.type !== 'EXPENSE_UPDATED')
            return null

        if (!activity.yourBalance &&
            activity.yourBalance !== 0) return null

        const balance = parseFloat(
            activity.yourBalance || 0)

        // If balance is exactly 0 — don't show tag
        if (Math.abs(balance) < 0.01) return null

        if (balance > 0) {
            return {
                text: `You get back ${formatCurrency(
                    balance)}`,
                type: 'pos'
            }
        }

        return {
            text: `You owe ${formatCurrency(
                Math.abs(balance))}`,
            type: 'neg'
        }
    }

    // ── Group activities by date ──
    const groupByDate = (activities) => {
        const groups = {}
        activities.forEach(a => {
            const dt = formatDateTime(a.createdAt)
            const key = dt.dateLabel || 'Unknown'
            if (!groups[key]) groups[key] = []
            groups[key].push(a)
        })
        return groups
    }

    const groupedActivities = groupByDate(activities)

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>
                Recent Activity
            </h1>

            {loading ? (
                <div className={styles.loading}>
                    Loading activity…
                </div>
            ) : activities.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>
                        📋
                    </div>
                    <p className={styles.emptyText}>
                        No activity yet.
                    </p>
                    <p className={styles.emptySub}>
                        Start by creating a group
                        or adding an expense!
                    </p>
                </div>
            ) : (
                Object.entries(groupedActivities)
                    .map(([dateLabel, items]) => (
                    <div
                        key={dateLabel}
                        className={styles.dateGroup}
                    >
                        {/* Date header */}
                        <div className={
                            styles.dateHeader}>
                            {dateLabel}
                        </div>

                        {/* Activity items */}
                        <div className={styles.card}>
                            {items.map((a, idx) => {
                                const config =
                                    TYPE_CONFIG[a.type]
                                    || TYPE_CONFIG
                                        .EXPENSE_ADDED
                                const dt =
                                    formatDateTime(
                                        a.createdAt)
                                const balTag =
                                    getBalanceTag(a)
                                const desc = a.description || ''

                                return (
                                    <div
                                        key={a.id}
                                        className={`${styles.row} ${idx < items.length - 1
                                            ? styles.rowBorder
                                            : ''}`}
                                    >
                                        {/* Icon */}
                                        <div
                                            className={
                                                styles.icon}
                                            style={{
                                                background:
                                                    config.bg
                                            }}
                                        >
                                            {config.icon}
                                        </div>

                                        {/* Content */}
                                        <div className={styles.content}>

                                            {/* Description */}
                                            <div className={`${styles.desc} ${a.type === 'EXPENSE_DELETED'
                                                ? styles.descDeleted : ''}`}>
                                                {desc}
                                            </div>

                                            {/* Balance tag */}
                                            {balTag && (
                                                <div className={
                                                    a.type === 'EXPENSE_DELETED'
                                                        ? styles.tagDeleted
                                                        : balTag.type === 'pos'
                                                            ? styles.tagPos
                                                            : styles.tagNeg
                                                }>
                                                    {balTag.text}
                                                </div>
                                            )}

                                            {/* Date and Time */}
                                            <div className={styles.time}>
                                                {dt.dateLabel !== 'Today' &&
                                                dt.dateLabel !== 'Yesterday'
                                                    ? `${dt.dateLabel}, ${dt.time}`
                                                    : dt.time
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}