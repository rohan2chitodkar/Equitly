import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { groupApi } from '../api/groupApi'
import { useAuth } from '../context/AuthContext'
import AddExpenseModal from '../components/expenses/AddExpenseModal'
import SettleUpModal from '../components/friends/SettleUpModal'
import Modal from '../components/common/Modal'
import Avatar from '../components/common/Avatar'
import {
    formatCurrency,
    CATEGORY_EMOJI,
    CATEGORY_COLORS
} from '../utils/formatCurrency'
import toast from 'react-hot-toast'
import styles from './GroupDetail.module.css'

export default function GroupDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const {
        friends,
        addExpense,
        settleUp,
        fetchGroups,
        deleteExpense,
        updateExpense
    } = useApp()

    const [group, setGroup] = useState(null)
    const [expenses, setExpenses] = useState([])
    const [balances, setBalances] = useState([])
    const [settledStatus, setSettledStatus] =
        useState({
            fullySettled: false,
            memberSettled: false
        })
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [showSettle, setShowSettle] =
        useState(false)
    const [showAddMember, setShowAddMember] =
        useState(false)
    const [memberEmail, setMemberEmail] =
        useState('')
    const [addingMember, setAddingMember] =
        useState(false)
    const [deleting, setDeleting] = useState(false)
    const [leaving, setLeaving] = useState(false)
    const [linkCopied, setLinkCopied] =
        useState(false)
    const [activeTab, setActiveTab] =
        useState('expenses')

    // ── Edit expense state ──
    const [editingExpense, setEditingExpense] =
        useState(null)

    // ── Group expenses by month ──
    const groupByMonth = (expenses) => {
        const grouped = {}
        expenses.forEach(e => {
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

    // ── Load group data ──
    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const [g, b, s] =
                    await Promise.all([
                        groupApi.getById(id),
                        groupApi.getBalances(id),
                        groupApi.checkSettled(id)
                    ])
                setGroup(g)
                setExpenses(
                    Array.isArray(g.expenses)
                        ? g.expenses : [])
                setBalances(
                    Array.isArray(b) ? b : [])
                setSettledStatus({
                    fullySettled:
                        s?.fullySettled === true,
                    memberSettled:
                        s?.memberSettled === true
                })
            } catch {
                toast.error('Failed to load group')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    // ── Refresh group ──
    const refreshGroup = async () => {
        try {
            const [freshGroup, b, s] =
                await Promise.all([
                    groupApi.getById(id),
                    groupApi.getBalances(id),
                    groupApi.checkSettled(id)
                ])
            setGroup(freshGroup)
            setExpenses(
                Array.isArray(freshGroup.expenses)
                    ? freshGroup.expenses : [])
            setBalances(Array.isArray(b) ? b : [])
            setSettledStatus({
                fullySettled:
                    s?.fullySettled === true,
                memberSettled:
                    s?.memberSettled === true
            })
        } catch {
            toast.error('Failed to refresh group')
        }
    }

    // ── Add expense ──
    const handleAddExpense = async (payload) => {
        try {
            await addExpense({
                ...payload, groupId: id
            })
            await refreshGroup()
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Failed to add expense'
            )
        }
    }

    // ── Edit expense ──
    const handleEditExpense = async (payload) => {
        try {
            await updateExpense(
                editingExpense.id, payload)
            toast.success('Expense updated!')
            setEditingExpense(null)
            setShowAdd(false)
            await refreshGroup()
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Failed to update expense'
            )
        }
    }

    // ── Delete expense ──
    const handleDeleteExpense = async (
            expenseId) => {
        if (!window.confirm(
                'Delete this expense?')) return
        try {
            await deleteExpense(expenseId)
            toast.success('Expense deleted!')
            await refreshGroup()
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Failed to delete expense'
            )
        }
    }

    // ── Add member ──
    const handleAddMember = async () => {
        if (!memberEmail.trim()) return
        setAddingMember(true)
        try {
            const updated = await groupApi
                .addMember(id, memberEmail.trim())
            if (updated && updated.members) {
                setGroup(prev => ({
                    ...prev,
                    members: updated.members,
                    createdBy: updated.createdBy
                        || prev.createdBy
                }))
            } else {
                await refreshGroup()
            }
            setMemberEmail('')
            setShowAddMember(false)
            toast.success('Member added!')
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Failed to add member'
            )
        } finally {
            setAddingMember(false)
        }
    }

    // ── Share link ──
    const handleShareLink = () => {
        const link =
            `${window.location.origin}/groups/${id}`
        navigator.clipboard.writeText(link)
            .then(() => {
                setLinkCopied(true)
                toast.success('Group link copied!')
                setTimeout(() =>
                    setLinkCopied(false), 3000)
            })
            .catch(() => {
                const el =
                    document.createElement('textarea')
                el.value = link
                document.body.appendChild(el)
                el.select()
                document.execCommand('copy')
                document.body.removeChild(el)
                setLinkCopied(true)
                toast.success('Link copied!')
                setTimeout(() =>
                    setLinkCopied(false), 3000)
            })
    }

    // ── Delete group ──
    const handleDelete = async () => {
        if (!settledStatus.fullySettled) {
            toast.error(
                'All members must settle first')
            return
        }
        if (!window.confirm(
                `Delete "${group.name}"? ` +
                `This cannot be undone.`)) return
        setDeleting(true)
        try {
            await groupApi.delete(id)
            await fetchGroups()
            toast.success('Group deleted!')
            navigate('/groups')
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Failed to delete'
            )
        } finally {
            setDeleting(false)
        }
    }

    // ── Leave group ──
    const handleLeave = async () => {
        if (!settledStatus.memberSettled) {
            toast.error(
                'Settle your balance before leaving')
            return
        }
        if (!window.confirm(
                `Leave "${group.name}"?`)) return
        setLeaving(true)
        try {
            await groupApi.leave(id)
            await fetchGroups()
            toast.success('You left the group')
            navigate('/groups')
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Failed to leave'
            )
        } finally {
            setLeaving(false)
        }
    }

    // ── Get split label for expense ──
    const getExpenseSplitLabel = (expense) => {
        const myId = String(user?.id || '')
        const paidById = String(
            expense.paidBy?.id || '')
        const paidByMe = paidById === myId
        const total = parseFloat(
            expense.amount || 0)

        const mySplit = expense.splits?.find(s => {
            const sid1 = String(s.userId || '')
            const sid2 = String(s.user?.id || '')
            return sid1 === myId || sid2 === myId
        })
        const myShare = parseFloat(
            mySplit?.amount || 0)

        if (paidByMe) {
            const lent = total - myShare
            if (lent > 0.01) {
                return {
                    label: 'you lent',
                    amount: formatCurrency(lent),
                    type: 'lent'
                }
            }
            return {
                label: 'paid in full',
                amount: '',
                type: 'neutral'
            }
        } else {
            if (myShare > 0.01) {
                return {
                    label: 'you borrowed',
                    amount: formatCurrency(myShare),
                    type: 'borrowed'
                }
            }
            return {
                label: 'not involved',
                amount: '',
                type: 'neutral'
            }
        }
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

    const isCreator =
        group?.createdBy?.id === user?.id
    const isOnlyMember =
        group?.members?.length <= 1 &&
        expenses.length === 0
    const groupedExpenses =
        groupByMonth(expenses)

    if (loading) return (
        <div className={styles.loading}>
            Loading group…
        </div>
    )
    if (!group) return (
        <div className={styles.loading}>
            Group not found.
        </div>
    )

    return (
        <div className={styles.page}>

            {/* ── Top Header ── */}
            <div className={styles.topHeader}>
                <Link
                    to="/groups"
                    className={styles.back}
                >
                    ← Groups
                </Link>
                <div className={styles.groupTitleRow}>
                    <span className={
                        styles.groupEmoji}>
                        {group.emoji}
                    </span>
                    <h1 className={styles.groupName}>
                        {group.name}
                    </h1>
                </div>

                {/* Action buttons */}
                <div className={styles.topActions}>
                    <button
                        className={styles.btnPrimary}
                        onClick={() => {
                            setEditingExpense(null)
                            setShowAdd(true)
                        }}
                    >
                        + Add an expense
                    </button>
                    <button
                        className={styles.btnSettle}
                        onClick={() =>
                            setShowSettle(true)}
                    >
                        Settle up
                    </button>
                </div>
            </div>

            {/* ── Tab bar ── */}
            <div className={styles.tabBar}>
                {['expenses', 'balances',
                  'members', 'settings'].map(tab => (
                    <button
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab
                            ? styles.tabActive : ''}`}
                        onClick={() =>
                            setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase()
                            + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* ── Main layout ── */}
            <div className={styles.layout}>

                {/* ── Left column ── */}
                <div className={styles.leftCol}>

                    {/* ══ Expenses Tab ══ */}
                    {activeTab === 'expenses' && (
                        <div>
                            {isOnlyMember ? (
                                <div className={
                                    styles.emptyGroupCard}>
                                    <div className={
                                        styles.emptyGroupEmoji}>
                                        {group.emoji}
                                    </div>
                                    <h2 className={
                                        styles.emptyGroupTitle}>
                                        You're the only
                                        one here!
                                    </h2>
                                    <p className={
                                        styles.emptyGroupSub}>
                                        Invite friends to{' '}
                                        <strong>
                                            {group.name}
                                        </strong>{' '}
                                        to start splitting.
                                    </p>
                                    <div className={
                                        styles.emptyActions}>
                                        <button
                                            className={
                                                styles
                                                .emptyActionBtn}
                                            onClick={() =>
                                                setShowAddMember(
                                                    true)}
                                        >
                                            <span>👥</span>
                                            <div>
                                                <div className={
                                                    styles
                                                    .emptyActionTitle}>
                                                    Add Members
                                                </div>
                                            </div>
                                            <span>→</span>
                                        </button>
                                        <button
                                            className={
                                                styles
                                                .emptyActionBtn}
                                            onClick={
                                                handleShareLink}
                                        >
                                            <span>
                                                {linkCopied
                                                    ? '✅'
                                                    : '🔗'}
                                            </span>
                                            <div>
                                                <div className={
                                                    styles
                                                    .emptyActionTitle}>
                                                    {linkCopied
                                                        ? 'Copied!'
                                                        : 'Share Link'}
                                                </div>
                                            </div>
                                            <span>→</span>
                                        </button>
                                    </div>
                                    <div className={
                                        styles.orDivider}>
                                        <span>or</span>
                                    </div>
                                    <button
                                        className={
                                            styles.addAnywayBtn}
                                        onClick={() => {
                                            setEditingExpense(
                                                null)
                                            setShowAdd(true)
                                        }}
                                    >
                                        + Add first expense
                                    </button>
                                </div>
                            ) : expenses.length === 0 ? (
                                <div className={
                                    styles.noExpenses}>
                                    <div className={
                                        styles.noExpensesIcon}>
                                        🧾
                                    </div>
                                    <p>No expenses yet.</p>
                                    <button
                                        className={
                                            styles.btnPrimary}
                                        onClick={() => {
                                            setEditingExpense(
                                                null)
                                            setShowAdd(true)
                                        }}
                                    >
                                        + Add first expense
                                    </button>
                                </div>
                            ) : (
                                Object.entries(
                                    groupedExpenses
                                ).map(([month,
                                    monthExpenses]) => (
                                    <div key={month}>

                                        {/* Month header */}
                                        <div className={
                                            styles.monthHeader}>
                                            <span>
                                                {month}
                                            </span>
                                        </div>

                                        {/* Expense rows */}
                                        {monthExpenses
                                            .map(expense => {
                                            const {
                                                day,
                                                month: mon
                                            } = formatDate(
                                                expense
                                                .createdAt)
                                            const split =
                                                getExpenseSplitLabel(
                                                    expense)
                                            const emoji =
                                                CATEGORY_EMOJI[
                                                expense
                                                .category
                                                ] || '📌'
                                            const bg =
                                                CATEGORY_COLORS[
                                                expense
                                                .category
                                                ] || '#f5f4f0'

                                            // Can this user
                                            // edit/delete?
                                            const canModify =
                                                String(
                                                expense.paidBy
                                                ?.id || '')
                                                === String(
                                                user?.id || '')
                                                ||
                                                String(
                                                expense
                                                .createdBy
                                                ?.id || '')
                                                === String(
                                                user?.id || '')

                                            return (
                                                <div
                                                    key={
                                                        expense.id}
                                                    className={
                                                        styles
                                                        .expenseRow}
                                                >
                                                {/* Date */}
                                                <div className={
                                                    styles
                                                    .expenseDate}>
                                                    <span className={
                                                        styles
                                                        .expMon}>
                                                        {mon}
                                                    </span>
                                                    <span className={
                                                        styles
                                                        .expDay}>
                                                        {day}
                                                    </span>
                                                </div>

                                                {/* Icon */}
                                                <div
                                                    className={
                                                        styles
                                                        .expIcon}
                                                    style={{
                                                        background:
                                                            bg
                                                    }}
                                                >
                                                    {emoji}
                                                </div>

                                                {/* Info */}
                                                <div className={
                                                    styles
                                                    .expInfo}>
                                                    <div className={
                                                        styles
                                                        .expName}>
                                                        {expense
                                                        .description}
                                                    </div>
                                                    <div className={
                                                        styles
                                                        .expPaidBy}>
                                                        {expense
                                                        .paidBy
                                                        ?.id ===
                                                        user?.id
                                                            ? `you paid ${formatCurrency(expense.amount)}`
                                                            : `${expense.paidBy?.name} paid ${formatCurrency(expense.amount)}`
                                                        }
                                                    </div>
                                                </div>

                                                {/* Split */}
                                                <div className={
                                                    styles
                                                    .expAmounts}>
                                                    {split.type
                                                    !== 'neutral'
                                                    ? (
                                                        <div className={
                                                            split.type
                                                            === 'lent'
                                                                ? styles.expLent
                                                                : styles.expBorrowed
                                                        }>
                                                            <div className={
                                                                styles
                                                                .expSplitLabel}>
                                                                {split.label}
                                                            </div>
                                                            <div className={
                                                                styles
                                                                .expSplitAmt}>
                                                                {split.amount}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={
                                                            styles
                                                            .expNeutral}>
                                                            not involved
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                {canModify && (
                                                    <div className={
                                                        styles
                                                        .expActions}>
                                                        <button
                                                            className={
                                                                styles
                                                                .expActionBtn}
                                                            onClick={
                                                                () => {
                                                                setEditingExpense(
                                                                    expense)
                                                                setShowAdd(
                                                                    true)
                                                            }}
                                                            title="Edit"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className={`${styles.expActionBtn} ${styles.expDeleteBtn}`}
                                                            onClick={
                                                                () =>
                                                                handleDeleteExpense(
                                                                    expense
                                                                    .id)
                                                            }
                                                            title="Delete"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ══ Balances Tab ══ */}
                    {activeTab === 'balances' && (
                        <div className={styles.card}>
                            <div className={
                                styles.cardHeader}>
                                <h3 className={
                                    styles.cardTitle}>
                                    Group Balances
                                </h3>
                            </div>
                            <div className={
                                styles.cardBody}>
                                {balances.length
                                    === 0 ? (
                                    <div className={
                                        styles
                                        .allSettled}>
                                        ✅ All settled up!
                                    </div>
                                ) : (
                                    balances.map(
                                        (b, i) => (
                                        <div
                                            key={i}
                                            className={
                                                styles
                                                .balanceRow}
                                        >
                                            <Avatar
                                                name={
                                                    b.friendName}
                                                size={36}
                                            />
                                            <div className={
                                                styles
                                                .balanceInfo}>
                                                <div className={
                                                    styles
                                                    .balanceName}>
                                                    {b.friendName}
                                                </div>
                                                <div className={
                                                    parseFloat(
                                                    b.netAmount)
                                                    >= 0
                                                        ? styles
                                                            .balancePos
                                                        : styles
                                                            .balanceNeg
                                                }>
                                                    {parseFloat(
                                                    b.netAmount)
                                                    >= 0
                                                        ? `gets back ${formatCurrency(b.netAmount)}`
                                                        : `owes ${formatCurrency(Math.abs(parseFloat(b.netAmount)))}`
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ══ Members Tab ══ */}
                    {activeTab === 'members' && (
                        <div className={styles.card}>
                            <div className={
                                styles.cardHeader}>
                                <h3 className={
                                    styles.cardTitle}>
                                    Members (
                                    {group.members
                                        ?.length || 0}
                                    )
                                </h3>
                                <button
                                    className={
                                        styles.btnSmall}
                                    onClick={() =>
                                        setShowAddMember(
                                            true)}
                                >
                                    + Add
                                </button>
                            </div>
                            <div className={
                                styles.cardBody}>
                                {group.members
                                    ?.map(m => (
                                    <div
                                        key={m.id}
                                        className={
                                            styles
                                            .memberRow}
                                    >
                                        <Avatar
                                            name={m.name}
                                            size={38}
                                        />
                                        <div className={
                                            styles
                                            .memberInfo}>
                                            <div className={
                                                styles
                                                .memberName}>
                                                {m.name}
                                                {m.id ===
                                                group
                                                .createdBy
                                                ?.id && (
                                                    <span className={
                                                        styles
                                                        .adminBadge}>
                                                        admin
                                                    </span>
                                                )}
                                            </div>
                                            <div className={
                                                styles
                                                .memberEmail}>
                                                {m.email}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ══ Settings Tab ══ */}
                    {activeTab === 'settings' && (
                        <div className={styles.card}>
                            <div className={
                                styles.cardHeader}>
                                <h3 className={
                                    styles.cardTitle}>
                                    Group Settings
                                </h3>
                            </div>
                            <div className={
                                styles.cardBody}>

                                {/* Share link */}
                                <div className={
                                    styles.settingRow}>
                                    <div className={
                                        styles
                                        .settingInfo}>
                                        <div className={
                                            styles
                                            .settingTitle}>
                                            Share Group
                                            Link
                                        </div>
                                        <div className={
                                            styles
                                            .settingDesc}>
                                            Invite new
                                            members
                                        </div>
                                    </div>
                                    <button
                                        className={
                                            styles
                                            .btnSmall}
                                        onClick={
                                            handleShareLink}
                                    >
                                        {linkCopied
                                            ? '✅ Copied'
                                            : '🔗 Copy'}
                                    </button>
                                </div>

                                {/* Add Member */}
                                <div className={
                                    styles.settingRow}>
                                    <div className={
                                        styles
                                        .settingInfo}>
                                        <div className={
                                            styles
                                            .settingTitle}>
                                            Add Member
                                        </div>
                                        <div className={
                                            styles
                                            .settingDesc}>
                                            Add by email
                                        </div>
                                    </div>
                                    <button
                                        className={
                                            styles
                                            .btnSmall}
                                        onClick={() =>
                                            setShowAddMember(
                                                true)}
                                    >
                                        + Add
                                    </button>
                                </div>

                                {/* Leave Group */}
                                {!isCreator && (
                                    <div className={
                                        styles
                                        .settingRow}>
                                        <div className={
                                            styles
                                            .settingInfo}>
                                            <div className={
                                                styles
                                                .settingTitle}>
                                                Leave Group
                                            </div>
                                            <div className={
                                                styles
                                                .settingDesc}>
                                                {settledStatus
                                                .memberSettled
                                                    ? '✅ Balance settled'
                                                    : '⚠️ Settle first'}
                                            </div>
                                        </div>
                                        <button
                                            className={
                                                settledStatus
                                                .memberSettled
                                                    ? styles
                                                        .btnWarn
                                                    : styles
                                                        .btnDisabledWarn}
                                            onClick={
                                                handleLeave}
                                            disabled={
                                                leaving}
                                        >
                                            {leaving
                                                ? 'Leaving…'
                                                : '🚪 Leave'}
                                        </button>
                                    </div>
                                )}

                                {/* Delete Group */}
                                {isCreator && (
                                    <div className={
                                        styles
                                        .settingRow}>
                                        <div className={
                                            styles
                                            .settingInfo}>
                                            <div className={
                                                styles
                                                .settingTitle}>
                                                Delete Group
                                            </div>
                                            <div className={
                                                styles
                                                .settingDesc}>
                                                {settledStatus
                                                .fullySettled
                                                    ? '✅ All settled'
                                                    : '⚠️ All must settle first'}
                                            </div>
                                        </div>
                                        <button
                                            className={
                                                settledStatus
                                                .fullySettled
                                                    ? styles
                                                        .btnDanger
                                                    : styles
                                                        .btnDisabledDanger}
                                            onClick={
                                                handleDelete}
                                            disabled={
                                                deleting}
                                        >
                                            {deleting
                                                ? 'Deleting…'
                                                : '🗑️ Delete'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Right: Group Balances ── */}
                <div className={styles.rightCol}>
                    <div className={styles.card}>
                        <div className={
                            styles.cardHeader}>
                            <h3 className={
                                styles.cardTitle}>
                                GROUP BALANCES
                            </h3>
                        </div>
                        <div className={
                            styles.cardBody}>
                            {balances.length === 0 ? (
                                <div className={
                                    styles.allSettled}>
                                    ✅ All settled up!
                                </div>
                            ) : (
                                balances.map((b, i) => (
                                    <div
                                        key={i}
                                        className={
                                            styles
                                            .sideBalanceRow}
                                    >
                                        <Avatar
                                            name={
                                                b.friendName}
                                            size={36}
                                        />
                                        <div className={
                                            styles
                                            .sideBalanceInfo}>
                                            <div className={
                                                styles
                                                .sideBalanceName}>
                                                {b.friendName}
                                            </div>
                                            <div className={
                                                parseFloat(
                                                b.netAmount)
                                                >= 0
                                                    ? styles
                                                        .balancePos
                                                    : styles
                                                        .balanceNeg
                                            }>
                                                {parseFloat(
                                                b.netAmount)
                                                >= 0
                                                    ? `gets back ${formatCurrency(b.netAmount)}`
                                                    : `owes ${formatCurrency(Math.abs(parseFloat(b.netAmount)))}`
                                                }
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ MODALS ══ */}

            {/* Add Member */}
            {showAddMember && (
                <Modal
                    title="Add Member"
                    onClose={() => {
                        setShowAddMember(false)
                        setMemberEmail('')
                    }}
                    footer={
                        <>
                            <button
                                className={
                                    styles.btnOutline}
                                onClick={() => {
                                    setShowAddMember(
                                        false)
                                    setMemberEmail('')
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={
                                    styles.btnPrimary}
                                onClick={
                                    handleAddMember}
                                disabled={addingMember}
                            >
                                {addingMember
                                    ? 'Adding…'
                                    : 'Add Member'}
                            </button>
                        </>
                    }
                >
                    <div className={styles.formGroup}>
                        <label className={
                            styles.formLabel}>
                            Member's Email
                        </label>
                        <input
                            className={
                                styles.formInput}
                            type="email"
                            value={memberEmail}
                            onChange={e =>
                                setMemberEmail(
                                    e.target.value)}
                            placeholder="friend@email.com"
                            autoFocus
                            onKeyDown={e =>
                                e.key === 'Enter' &&
                                handleAddMember()}
                        />
                        <p className={styles.hint}>
                            They must have an
                            Equitly account.
                        </p>
                    </div>
                </Modal>
            )}

            {/* Add / Edit Expense */}
            {showAdd && (
                <AddExpenseModal
                    onClose={() => {
                        setShowAdd(false)
                        setEditingExpense(null)
                    }}
                    onSave={editingExpense
                        ? handleEditExpense
                        : handleAddExpense}
                    expense={editingExpense}
                    friends={
                        group.members?.filter(
                            m => m.id !== user?.id)
                        || friends
                    }
                    groups={[group]}
                    initialGroupId={id}
                />
            )}

            {/* Settle Up */}
            {showSettle && (
                <SettleUpModal
                    onClose={() =>
                        setShowSettle(false)}
                    balances={balances}
                    onSettle={async (
                            friendId, amount) => {
                        await settleUp(
                            friendId, amount, id)
                        const [b, s] =
                            await Promise.all([
                                groupApi.getBalances(
                                    id),
                                groupApi.checkSettled(
                                    id)
                            ])
                        setBalances(
                            Array.isArray(b)
                                ? b : [])
                        setSettledStatus(s)
                        setShowSettle(false)
                    }}
                />
            )}
        </div>
    )
}