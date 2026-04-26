import { useEffect, useState } from 'react'
import { activityApi } from '../api/activityApi'
import styles from './Activity.module.css'

const TYPE_CONFIG = {
    EXPENSE_ADDED: {
        icon: '🧾',
        bg: '#f0fdf4',
        label: 'Expense Added'
    },
    EXPENSE_UPDATED: {
        icon: '✏️',
        bg: '#fef9e6',
        label: 'Expense Updated'
    },
    EXPENSE_DELETED: {
        icon: '🗑️',
        bg: '#fdeee9',
        label: 'Expense Deleted'
    },
    GROUP_CREATED: {
        icon: '🏠',
        bg: '#e8f4fd',
        label: 'Group Created'
    },
    GROUP_DELETED: {
        icon: '❌',
        bg: '#fdeee9',
        label: 'Group Deleted'
    },
    MEMBER_ADDED: {
        icon: '👥',
        bg: '#fdf4ff',
        label: 'Member Added'
    },
    MEMBER_LEFT: {
        icon: '🚪',
        bg: '#fef5e6',
        label: 'Member Left'
    },
    SETTLEMENT: {
        icon: '💸',
        bg: '#e6f4ed',
        label: 'Settlement'
    }
}

export default function Activity() {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const data = await activityApi.getAll()
                setActivities(Array.isArray(data) ? data : [])
            } catch {
                setActivities([])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatCurrency = (amount) => {
        if (!amount) return ''
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount)
    }

    const getBalanceTag = (activity) => {
        if (!activity.yourBalance &&
            activity.type !== 'EXPENSE_ADDED') return null

        const balance = parseFloat(activity.yourBalance || 0)
        if (Math.abs(balance) < 0.01) return null

        if (balance > 0) {
            return (
                <span className={styles.tagPos}>
                    you get back {formatCurrency(balance)}
                </span>
            )
        } else {
            return (
                <span className={styles.tagNeg}>
                    you owe {formatCurrency(Math.abs(balance))}
                </span>
            )
        }
    }

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Recent Activity</h2>
                {activities.length > 0 && (
                    <span className={styles.count}>
                        {activities.length}
                    </span>
                )}
            </div>
            <div className={styles.cardBody}>
                {loading ? (
                    <div className={styles.loading}>
                        Loading activity…
                    </div>
                ) : activities.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>📋</div>
                        <p>No activity yet. Start by creating a group
                            or adding an expense!</p>
                    </div>
                ) : (
                    activities.map(a => {
                        const config = TYPE_CONFIG[a.type] ||
                            TYPE_CONFIG.EXPENSE_ADDED
                        return (
                            <div key={a.id} className={styles.row}>

                                {/* Icon */}
                                <div
                                    className={styles.icon}
                                    style={{ background: config.bg }}
                                >
                                    {config.icon}
                                </div>

                                {/* Content */}
                                <div className={styles.content}>
                                    <div className={styles.topRow}>
                                        <span className={styles.description}>
                                            {a.description}
                                        </span>
                                        {a.amount && (
                                            <span className={styles.amount}>
                                                {formatCurrency(a.amount)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Group tag */}
                                    {a.groupName && (
                                        <div className={styles.groupTag}>
                                            🏠 {a.groupName}
                                        </div>
                                    )}

                                    {/* Balance tag — you owe / you get back */}
                                    {getBalanceTag(a)}

                                    {/* Date */}
                                    <div className={styles.date}>
                                        {formatDate(a.createdAt)}
                                    </div>
                                </div>

                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}