import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/common/Avatar'
import AddExpenseModal from '../components/expenses/AddExpenseModal'
import SettleUpModal from '../components/friends/SettleUpModal'
import Modal from '../components/common/Modal'
import { formatCurrency } from '../utils/formatCurrency'
import toast from 'react-hot-toast'
import styles from './Friends.module.css'

export default function Friends() {
    const { user } = useAuth()
    const {
        friends,
        groups,
        balances,
        fetchFriends,
        fetchBalances,
        fetchGroups,
        addFriend,
        removeFriend,
        addExpense,
        settleUp
    } = useApp()

    const [showAddFriend, setShowAddFriend] = useState(false)
    const [friendEmail, setFriendEmail] = useState('')
    const [addingFriend, setSavingFriend] = useState(false)

    // Selected friend for expense/settle
    const [selectedFriend, setSelectedFriend] =
        useState(null)
    const [showAddExpense, setShowAddExpense] =
        useState(false)
    const [showSettle, setShowSettle] = useState(false)

    useEffect(() => {
        fetchFriends()
        fetchBalances()
        fetchGroups()
    }, [])

    // Build combined people list
    // (friends + group members, excluding self)
    const allPeople = (() => {
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
                            !map.has(m.id)) {
                        map.set(m.id, m)
                    }
                })
            })
        }
        return Array.from(map.values())
            .sort((a, b) =>
                (a.name || '').localeCompare(
                    b.name || ''))
    })()

    // Get balance with a specific person
    const getBalance = (personId) => {
        const bal = balances.find(
            b => b.friendId === personId)
        return bal
            ? parseFloat(bal.netAmount) : 0
    }

    const handleAddFriend = async () => {
        if (!friendEmail.trim()) return
        setSavingFriend(true)
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
            setSavingFriend(false)
        }
    }

    const handleAddExpense = async (payload) => {
        await addExpense(payload)
        await fetchBalances()
        setShowAddExpense(false)
    }

    const handleSettle = async (friendId, amount) => {
        await settleUp(friendId, amount, null)
        await fetchBalances()
        setShowSettle(false)
    }

    return (
        <div className={styles.page}>

            {/* ── Header ── */}
            <div className={styles.header}>
                <h1 className={styles.title}>Friends</h1>
                <button
                    className={styles.btnPrimary}
                    onClick={() => setShowAddFriend(true)}
                >
                    + Add Friend
                </button>
            </div>

            {/* ── Friends list ── */}
            {allPeople.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>
                        👥
                    </div>
                    <p className={styles.emptyTitle}>
                        No friends yet
                    </p>
                    <p className={styles.emptySub}>
                        Add friends or join a group to
                        start splitting expenses.
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
                        const bal = getBalance(person.id)
                        const isSelected =
                            selectedFriend?.id === person.id

                        return (
                            <div key={person.id}>
                                {/* ── Friend row ── */}
                                <div
                                    className={`${styles.friendRow} ${isSelected
                                        ? styles.friendRowActive
                                        : ''}`}
                                    onClick={() =>
                                        setSelectedFriend(
                                            isSelected
                                                ? null
                                                : person)}
                                >
                                    {/* Avatar */}
                                    <Avatar
                                        name={person.name}
                                        size={44}
                                    />

                                    {/* Info */}
                                    <div className={
                                        styles.friendInfo}>
                                        <div className={
                                            styles.friendName}>
                                            {person.name}
                                        </div>
                                        <div className={
                                            styles.friendEmail}>
                                            {person.email}
                                        </div>
                                    </div>

                                    {/* Balance */}
                                    <div className={
                                        styles.balanceWrap}>
                                        {Math.abs(bal)
                                            < 0.01 ? (
                                            <span className={
                                                styles.settled}>
                                                settled
                                            </span>
                                        ) : bal > 0 ? (
                                            <div className={
                                                styles.balancePos}>
                                                <div className={
                                                    styles.balLabel}>
                                                    owes you
                                                </div>
                                                <div className={
                                                    styles.balAmt}>
                                                    {formatCurrency(
                                                        bal)}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={
                                                styles.balanceNeg}>
                                                <div className={
                                                    styles.balLabel}>
                                                    you owe
                                                </div>
                                                <div className={
                                                    styles.balAmt}>
                                                    {formatCurrency(
                                                        Math.abs(
                                                            bal))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Chevron */}
                                    <span className={
                                        styles.chevron}>
                                        {isSelected
                                            ? '▲' : '▼'}
                                    </span>
                                </div>

                                {/* ── Expanded detail ── */}
                                {isSelected && (
                                    <div className={
                                        styles.detail}>

                                        {/* Person name header */}
                                        <div className={
                                            styles.detailHeader}>
                                            <Avatar
                                                name={
                                                    person.name}
                                                size={52}
                                            />
                                            <div>
                                                <div className={
                                                    styles.detailName}>
                                                    {person.name}
                                                </div>
                                                {/* Balance status */}
                                                {Math.abs(bal)
                                                    < 0.01 ? (
                                                    <div className={
                                                        styles.detailSettled}>
                                                        ✅ You and{' '}
                                                        {person.name}{' '}
                                                        are settled up.
                                                    </div>
                                                ) : bal > 0 ? (
                                                    <div className={
                                                        styles.detailOwed}>
                                                        {person.name} owes
                                                        you{' '}
                                                        <strong>
                                                            {formatCurrency(
                                                                bal)}
                                                        </strong>
                                                    </div>
                                                ) : (
                                                    <div className={
                                                        styles.detailOwe}>
                                                        You owe{' '}
                                                        {person.name}{' '}
                                                        <strong>
                                                            {formatCurrency(
                                                                Math.abs(
                                                                    bal))}
                                                        </strong>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className={
                                            styles.detailActions}>
                                            <button
                                                className={
                                                    styles.actionBtn}
                                                onClick={() =>
                                                    setShowAddExpense(
                                                        true)}
                                            >
                                                + Add Expense
                                            </button>

                                            {Math.abs(bal)
                                                > 0.01 && (
                                                <button
                                                    className={
                                                        styles.settleBtn}
                                                    onClick={() =>
                                                        setShowSettle(
                                                            true)}
                                                >
                                                    💸 Settle Up
                                                </button>
                                            )}
                                        </div>

                                        {/* Shared groups */}
                                        {(() => {
                                            const shared =
                                                groups.filter(
                                                    g =>
                                                    g.members
                                                    ?.some(m =>
                                                        m.id ===
                                                        person.id)
                                                )
                                            return shared
                                                .length > 0
                                                ? (
                                                <div className={
                                                    styles.sharedGroups}>
                                                    <div className={
                                                        styles.sharedTitle}>
                                                        Shared groups
                                                    </div>
                                                    <div className={
                                                        styles.sharedList}>
                                                        {shared.map(
                                                            g => (
                                                            <span
                                                                key={g.id}
                                                                className={
                                                                    styles.groupTag}
                                                            >
                                                                {g.emoji}{' '}
                                                                {g.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null
                                        })()}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Add Friend Modal ── */}
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
                                className={styles.btnOutline}
                                onClick={() => {
                                    setShowAddFriend(false)
                                    setFriendEmail('')
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.btnPrimary}
                                onClick={handleAddFriend}
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
                        <label className={styles.label}>
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
                            They must have an Equitly account.
                        </p>
                    </div>
                </Modal>
            )}

            {/* ── Add Expense Modal ── */}
            {showAddExpense && selectedFriend && (
                <AddExpenseModal
                    onClose={() =>
                        setShowAddExpense(false)}
                    onSave={handleAddExpense}
                    friends={[selectedFriend]}
                    groups={groups}
                />
            )}

            {/* ── Settle Up Modal ── */}
            {showSettle && selectedFriend && (
                <SettleUpModal
                    onClose={() =>
                        setShowSettle(false)}
                    balances={balances.filter(b =>
                        b.friendId ===
                        selectedFriend.id)}
                    onSettle={handleSettle}
                />
            )}
        </div>
    )
}