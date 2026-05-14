import { useEffect, useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useLocation, useParams, useNavigate }
    from 'react-router-dom'
import Avatar from '../components/common/Avatar'
import AddExpenseModal
    from '../components/expenses/AddExpenseModal'
import SettleUpModal
    from '../components/friends/SettleUpModal'
import Modal from '../components/common/Modal'
import { formatCurrency }
    from '../utils/formatCurrency'
import { expenseApi } from '../api/expenseApi'
import toast from 'react-hot-toast'
import styles from './Friends.module.css'

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

export default function Friends() {
    const { user } = useAuth()
    const location = useLocation()
    const { personId } = useParams()
    const navigate = useNavigate()

    const {
        friends,
        groups,
        balances,
        fetchFriends,
        fetchBalances,
        fetchGroups,
        addFriend,
        addExpense,
        settleUp,
        deleteExpense,
        updateExpense
    } = useApp()

    // ── State ──
    const [showAddFriend, setShowAddFriend] =
        useState(false)
    const [friendEmail, setFriendEmail] =
        useState('')
    const [addingFriend, setAddingFriend] =
        useState(false)
    const [selectedPerson, setSelectedPerson] =
        useState(null)
    const [showAddExpense, setShowAddExpense] =
        useState(false)
    const [showSettle, setShowSettle] =
        useState(false)
    const [sharedExpenses, setSharedExpenses] =
        useState([])
    const [loadingExpenses, setLoadingExpenses] =
        useState(false)
    const [editingExpense, setEditingExpense] =
        useState(null)
    const [deletingId, setDeletingId] =
        useState(null)

    // ── Build combined people list ──
    const allPeople = useMemo(() => {
        const map = new Map()
        if (Array.isArray(friends)) {
            friends.forEach(f => {
                if (f.id !== user?.id)
                    map.set(f.id, f)
            })
        }
        if (Array.isArray(groups)) {
            groups.forEach(g => {
                g.members?.forEach(m => {
                    if (m.id !== user?.id &&
                            !map.has(m.id))
                        map.set(m.id, m)
                })
            })
        }
        return Array.from(map.values())
            .sort((a, b) =>
                (a.name || '').localeCompare(
                    b.name || ''))
    }, [friends, groups, user?.id])

    // ── Load data ──
    useEffect(() => {
        const init = async () => {
            await Promise.all([
                fetchFriends(),
                fetchBalances(),
                fetchGroups()
            ])
        }
        init()
    }, [location.key])

    // ── Auto select person from URL ──
    useEffect(() => {
        if (personId && allPeople.length > 0
                && !selectedPerson) {
            const person = allPeople.find(
                p => p.id === personId)
            if (person) {
                selectPerson(person)
            }
        }
    }, [personId, allPeople.length])

    // ── Get balance ──
    const getBalance = (pid) => {
        const bal = balances.find(
            b => b.friendId === pid)
        return bal
            ? parseFloat(bal.netAmount) : 0
    }

    // ── Load all shared expenses ──
    const loadSharedExpenses = async (person) => {
        setLoadingExpenses(true)
        try {
            const data = await expenseApi.getAll()
            const myId = String(user?.id || '')
            const friendId = String(person.id || '')

            // Filter expenses involving both users
            const relevant = data.filter(e => {
                const involvedIds = [
                    String(e.paidBy?.id || ''),
                    ...(e.splits?.map(s =>
                        String(s.userId ||
                            s.user?.id || ''))
                        || [])
                ]
                return (
                    involvedIds.includes(myId) &&
                    involvedIds.includes(friendId)
                )
            })

            // Sort newest first
            relevant.sort((a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt))

            setSharedExpenses(relevant)
        } catch {
            setSharedExpenses([])
        } finally {
            setLoadingExpenses(false)
        }
    }

    // ── Select person ──
    const selectPerson = async (person) => {
        setSelectedPerson(person)
        await loadSharedExpenses(person)
    }

    // ── Add friend ──
    const handleAddFriend = async () => {
        if (!friendEmail.trim()) return
        setAddingFriend(true)
        try {
            await addFriend(friendEmail.trim())
            setShowAddFriend(false)
            setFriendEmail('')
            await fetchFriends()
            toast.success('Friend added!')
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Failed to add friend'
            )
        } finally {
            setAddingFriend(false)
        }
    }

    // ── Add expense ──
    const handleAddExpense = async (payload) => {
        await addExpense({
            ...payload,
            groupId: null
        })
        await fetchBalances()
        setShowAddExpense(false)
        if (selectedPerson) {
            await loadSharedExpenses(selectedPerson)
        }
        toast.success('Expense added!')
    }

    // ── Settle up ──
    const handleSettle = async (
            friendId, amount) => {
        await settleUp(friendId, amount, null)
        await fetchBalances()
        setShowSettle(false)
        if (selectedPerson) {
            await loadSharedExpenses(selectedPerson)
        }
    }

    // ── Delete expense ──
    const handleDeleteExpense = async (
            expenseId) => {
        if (!window.confirm(
                'Delete this expense?')) return
        setDeletingId(expenseId)
        try {
            await deleteExpense(expenseId)
            toast.success('Expense deleted!')
            await fetchBalances()
            if (selectedPerson) {
                await loadSharedExpenses(
                    selectedPerson)
            }
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Failed to delete'
            )
        } finally {
            setDeletingId(null)
        }
    }

    // ── Edit expense ──
    const handleEditExpense = async (payload) => {
        try {
            await updateExpense(
                editingExpense.id, payload)
            toast.success('Expense updated!')
            setEditingExpense(null)
            await fetchBalances()
            if (selectedPerson) {
                await loadSharedExpenses(
                    selectedPerson)
            }
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Failed to update'
            )
        }
    }

    // ── Format date ──
    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        return new Date(dateStr)
            .toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })
    }

    // ── Group expenses by month ──
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

    // ── Get split role ──
    const getSplitRole = (expense) => {
        const myId = String(user?.id || '')
        const paidByMe =
            String(expense.paidBy?.id || '')
                === myId
        const total =
            parseFloat(expense.amount || 0)
        const mySplit = expense.splits?.find(s =>
            String(s.userId || '') === myId ||
            String(s.user?.id || '') === myId
        )
        const myShare = parseFloat(
            mySplit?.amount || 0)

        if (paidByMe) {
            const lent = total - myShare
            if (lent > 0.01) return {
                text: `you lent ${formatCurrency(lent)}`,
                type: 'lent'
            }
            return {
                text: 'paid in full',
                type: 'neutral'
            }
        } else if (myShare > 0.01) {
            return {
                text: `you borrowed ${formatCurrency(myShare)}`,
                type: 'borrowed'
            }
        }
        return { text: '', type: 'neutral' }
    }

    // ── Build display list ──
    // Group expenses → one row per group
    // Personal expenses → individual rows
    const buildDisplayList = (expenses) => {
        const myId = String(user?.id || '')
        const groupMap = new Map()
        const personal = []

        expenses.forEach(e => {
            if (e.group) {
                const gId = e.group.id
                if (!groupMap.has(gId)) {
                    groupMap.set(gId, {
                        id: gId,
                        name: e.group.name,
                        emoji: e.group.emoji || '👥',
                        isGroup: true,
                        latestDate: e.createdAt,
                        totalLent: 0,
                        totalBorrowed: 0,
                        expenses: []
                    })
                }
                const g = groupMap.get(gId)
                g.expenses.push(e)

                // Track latest date
                if (new Date(e.createdAt) >
                        new Date(g.latestDate)) {
                    g.latestDate = e.createdAt
                }

                // Calculate balance for this expense
                const role = getSplitRole(e)
                if (role.type === 'lent') {
                    const total = parseFloat(
                        e.amount || 0)
                    const mySplit = e.splits?.find(s =>
                        String(s.userId || '') === myId ||
                        String(s.user?.id || '') === myId
                    )
                    const myShare = parseFloat(
                        mySplit?.amount || 0)
                    g.totalLent += (total - myShare)
                } else if (role.type === 'borrowed') {
                    const mySplit = e.splits?.find(s =>
                        String(s.userId || '') === myId ||
                        String(s.user?.id || '') === myId
                    )
                    g.totalBorrowed += parseFloat(
                        mySplit?.amount || 0)
                }
            } else {
                personal.push({
                    ...e,
                    isGroup: false
                })
            }
        })

        // Combine: group summaries + personal
        const groupItems = Array.from(
            groupMap.values())
        const allItems = [
            ...groupItems,
            ...personal
        ]

        // Sort by latest date
        allItems.sort((a, b) => {
            const dateA = a.isGroup
                ? a.latestDate : a.createdAt
            const dateB = b.isGroup
                ? b.latestDate : b.createdAt
            return new Date(dateB) - new Date(dateA)
        })

        return allItems
    }

    const bal = selectedPerson
        ? getBalance(selectedPerson.id) : 0

    const groupedExpenses =
        groupByMonth(sharedExpenses)

    // ── Shared groups with selected person ──
    const sharedGroups = selectedPerson
        ? groups.filter(g =>
            g.members?.some(m =>
                m.id === selectedPerson.id))
        : []

    // ════════════════════════════════════════
    // ── Detail View ──
    // ════════════════════════════════════════
    if (selectedPerson) {
        return (
            <div className={styles.page}>

                {/* ── Back button ── */}
                <button
                    className={styles.backBtn}
                    onClick={() => {
                        setSelectedPerson(null)
                        setSharedExpenses([])
                        navigate('/friends')
                    }}
                >
                    ← Back to Friends
                </button>

                {/* ── Person header card ── */}
                <div className={styles.personCard}>
                    <div className={styles.personLeft}>
                        <Avatar
                            name={selectedPerson.name}
                            size={52}
                        />
                        <div>
                            <h2 className={
                                styles.personName}>
                                {selectedPerson.name}
                            </h2>
                            <p className={
                                styles.personEmail}>
                                {selectedPerson.email}
                            </p>
                        </div>
                    </div>

                    {/* ── Action buttons ── */}
                    <div className={
                        styles.personActions}>
                        <button
                            className={
                                styles.btnAddExpense}
                            onClick={() =>
                                setShowAddExpense(
                                    true)}
                        >
                            + Add an Expense
                        </button>
                        {Math.abs(bal) > 0.01 && (
                            <button
                                className={
                                    styles.btnSettleUp}
                                onClick={() =>
                                    setShowSettle(true)}
                            >
                                Settle up
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Balance status ── */}
                {Math.abs(bal) > 0.01 && (
                    <div className={`${styles.balStatus} ${bal > 0
                        ? styles.balStatusOwed
                        : styles.balStatusOwe}`}
                    >
                        {bal > 0
                            ? `${selectedPerson.name} owes you ${formatCurrency(bal)}`
                            : `You owe ${selectedPerson.name} ${formatCurrency(Math.abs(bal))}`
                        }
                    </div>
                )}

                {/* ── Shared groups ── */}
                {sharedGroups.length > 0 && (
                    <div className={
                        styles.sharedGroupsWrap}>
                        <span className={
                            styles.sharedGroupsLabel}>
                            Shared groups:
                        </span>
                        {sharedGroups.map(g => (
                            <span
                                key={g.id}
                                className={
                                    styles.groupChip}
                                onClick={() =>
                                    navigate(
                                        `/groups/${g.id}`)}
                            >
                                {g.emoji} {g.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* ── Expense history ── */}
                <div className={styles.historyWrap}>
                    {loadingExpenses ? (
                        <div className={
                            styles.historyLoading}>
                            Loading expenses…
                        </div>
                    ) : sharedExpenses.length === 0 ? (
                        <div className={styles.historyEmpty}>
                            <div className={styles.emptyIcon}>
                                🤝
                            </div>
                            <p className={styles.emptyTitle}>
                                You and{' '}
                                {selectedPerson.name}{' '}
                                are all settled up
                            </p>
                            <p className={styles.emptySub}>
                                No shared expenses yet.
                                Add one to get started!
                            </p>
                            <button
                                className={styles.btnAddExpense}
                                onClick={() =>
                                    setShowAddExpense(true)}
                            >
                                + Add an Expense
                            </button>
                        </div>
                    ) : (
                        <div className={styles.historyCard}>
                            <div className={styles.historyTitle}>
                                EXPENSE HISTORY
                            </div>
                            {buildDisplayList(sharedExpenses)
                                .map((item, idx) => {
                                if (item.isGroup) {
                                    // ── Group summary row ──
                                    const netBal =
                                        item.totalLent -
                                        item.totalBorrowed

                                    return (
                                        <div
                                            key={`g-${item.id}`}
                                            className={
                                                styles.historyRow}
                                            onClick={() =>
                                                navigate(
                                                    `/groups/${item.id}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {/* Group icon */}
                                            <div className={
                                                styles.groupHistIcon}>
                                                {item.emoji}
                                            </div>

                                            {/* Info */}
                                            <div className={
                                                styles.histInfo}>
                                                <div className={
                                                    styles.histDesc}>
                                                    {item.name}
                                                </div>
                                                <div className={
                                                    styles.histMeta}>
                                                    {item.expenses.length}{' '}
                                                    expense
                                                    {item.expenses.length
                                                    !== 1 ? 's' : ''} ·{' '}
                                                    {formatDate(
                                                        item.latestDate)}
                                                    <span className={
                                                        styles.groupTag}>
                                                        {' · '}Group
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Balance */}
                                            <div className={
                                                styles.histRight}>
                                                {Math.abs(netBal)
                                                    > 0.01 ? (
                                                    <div className={
                                                        netBal > 0
                                                            ? styles
                                                                .histLent
                                                            : styles
                                                                .histBorrowed
                                                    }>
                                                        {netBal > 0
                                                            ? `you lent ${formatCurrency(netBal)}`
                                                            : `you owe ${formatCurrency(Math.abs(netBal))}`
                                                        }
                                                    </div>
                                                ) : (
                                                    <div className={
                                                        styles.histSettled}>
                                                        settled
                                                    </div>
                                                )}
                                            </div>

                                            {/* Arrow */}
                                            <span className={
                                                styles.histArrow}>
                                                ›
                                            </span>
                                        </div>
                                    )
                                } else {
                                    // ── Personal expense row ──
                                    const role = getSplitRole(item)
                                    const emoji =
                                        CATEGORY_EMOJI[
                                            item.category] || '📌'
                                    const bg =
                                        CATEGORY_COLORS[
                                            item.category] || '#f5f4f0'
                                    const canEdit =
                                        String(item.paidBy?.id || '')
                                        === String(user?.id || '') ||
                                        String(item.createdBy?.id || '')
                                        === String(user?.id || '')

                                    return (
                                        <div
                                            key={`e-${item.id}`}
                                            className={styles.historyRow}
                                        >
                                            {/* Icon */}
                                            <div
                                                className={styles.histIcon}
                                                style={{ background: bg }}
                                            >
                                                {emoji}
                                            </div>

                                            {/* Info */}
                                            <div className={
                                                styles.histInfo}>
                                                <div className={
                                                    styles.histDesc}>
                                                    {item.description}
                                                </div>
                                                <div className={
                                                    styles.histMeta}>
                                                    {item.paidBy?.id ===
                                                    user?.id
                                                        ? 'you'
                                                        : item.paidBy?.name
                                                    } paid ·{' '}
                                                    {formatDate(
                                                        item.createdAt)}
                                                </div>
                                            </div>

                                            {/* Right */}
                                            <div className={
                                                styles.histRight}>
                                                <div className={
                                                    styles.histTotal}>
                                                    {formatCurrency(
                                                        item.amount)}
                                                </div>
                                                {role.type !== 'neutral'
                                                    && (
                                                    <div className={
                                                        role.type === 'lent'
                                                            ? styles.histLent
                                                            : styles
                                                                .histBorrowed
                                                    }>
                                                        {role.text}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            {canEdit && (
                                                <div className={
                                                    styles.histActions}>
                                                    <button
                                                        className={
                                                            styles.histBtn}
                                                        onClick={() =>
                                                            setEditingExpense(
                                                                item)}
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className={`${styles.histBtn} ${styles.histDeleteBtn}`}
                                                        onClick={() =>
                                                            handleDeleteExpense(
                                                                item.id)}
                                                        disabled={
                                                            deletingId ===
                                                            item.id}
                                                        title="Delete"
                                                    >
                                                        {deletingId ===
                                                        item.id
                                                            ? '...' : '🗑️'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                }
                            })}
                        </div>
                    )}
                </div>

                {/* ══ Modals ══ */}
                {showAddExpense && (
                    <AddExpenseModal
                        onClose={() =>
                            setShowAddExpense(false)}
                        onSave={handleAddExpense}
                        friends={[selectedPerson]}
                        groups={[]}
                        initialGroupId={null}
                    />
                )}

                {showSettle && (
                    <SettleUpModal
                        onClose={() =>
                            setShowSettle(false)}
                        balances={balances.filter(
                            b => b.friendId ===
                            selectedPerson.id)}
                        onSettle={handleSettle}
                    />
                )}

                {editingExpense && (
                    <AddExpenseModal
                        expense={editingExpense}
                        onClose={() =>
                            setEditingExpense(null)}
                        onSave={handleEditExpense}
                        friends={[selectedPerson]}
                        groups={[]}
                        initialGroupId={null}
                    />
                )}
            </div>
        )
    }

    // ════════════════════════════════════════
    // ── Friends list view ──
    // ════════════════════════════════════════
    return (
        <div className={styles.page}>

            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>
                    Friends
                </h1>
                <button
                    className={styles.btnPrimary}
                    onClick={() =>
                        setShowAddFriend(true)}
                >
                    + Add Friend
                </button>
            </div>

            {allPeople.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>
                        👥
                    </div>
                    <p className={styles.emptyTitle}>
                        No friends yet
                    </p>
                    <p className={styles.emptySub}>
                        Add friends or join a group.
                    </p>
                    <button
                        className={styles.btnPrimary}
                        onClick={() =>
                            setShowAddFriend(true)}
                    >
                        + Add Friend
                    </button>
                </div>
            ) : (
                <div className={styles.friendsList}>
                    {allPeople.map(person => {
                        const bal =
                            getBalance(person.id)
                        return (
                            <div
                                key={person.id}
                                className={
                                    styles.friendRow}
                                onClick={() =>
                                    selectPerson(
                                        person)}
                            >
                                <Avatar
                                    name={person.name}
                                    size={44}
                                />
                                <div className={
                                    styles.friendInfo}>
                                    <div className={
                                        styles
                                        .friendName}>
                                        {person.name}
                                    </div>
                                    <div className={
                                        styles
                                        .friendEmail}>
                                        {person.email}
                                    </div>
                                </div>
                                <div className={
                                    styles.balWrap}>
                                    {Math.abs(bal)
                                        < 0.01 ? (
                                        <span className={
                                            styles
                                            .settled}>
                                            settled
                                        </span>
                                    ) : bal > 0 ? (
                                        <div className={
                                            styles.balPos}>
                                            <div className={
                                                styles
                                                .balLabel}>
                                                owes you
                                            </div>
                                            <div className={
                                                styles
                                                .balAmt}>
                                                {formatCurrency(
                                                    bal)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={
                                            styles.balNeg}>
                                            <div className={
                                                styles
                                                .balLabel}>
                                                you owe
                                            </div>
                                            <div className={
                                                styles
                                                .balAmt}>
                                                {formatCurrency(
                                                    Math.abs(
                                                        bal))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span className={
                                    styles.arrow}>
                                    ›
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add Friend Modal */}
            {showAddFriend && (
                <Modal
                    title="Add Friend"
                    onClose={() => {
                        setShowAddFriend(false)
                        setFriendEmail('')
                    }}
                    footer={
                        <>
                            <button
                                className={
                                    styles.btnOutline}
                                onClick={() => {
                                    setShowAddFriend(
                                        false)
                                    setFriendEmail('')
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={
                                    styles.btnPrimary}
                                onClick={
                                    handleAddFriend}
                                disabled={addingFriend}
                            >
                                {addingFriend
                                    ? 'Adding…'
                                    : 'Add Friend'}
                            </button>
                        </>
                    }
                >
                    <div className={styles.formGroup}>
                        <label className={
                            styles.label}>
                            Friend's Email
                        </label>
                        <input
                            className={styles.input}
                            type="email"
                            value={friendEmail}
                            onChange={e =>
                                setFriendEmail(
                                    e.target.value)}
                            placeholder="friend@email.com"
                            autoFocus
                            onKeyDown={e =>
                                e.key === 'Enter' &&
                                handleAddFriend()}
                        />
                        <p className={styles.hint}>
                            They must have an
                            Equitly account.
                        </p>
                    </div>
                </Modal>
            )}
        </div>
    )
}