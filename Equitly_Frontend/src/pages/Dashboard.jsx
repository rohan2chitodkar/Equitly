import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import AddExpenseModal from '../components/expenses/AddExpenseModal'
import SettleUpModal from '../components/friends/SettleUpModal'
import Avatar from '../components/common/Avatar'
import { formatCurrency } from '../utils/formatCurrency'
import styles from './Dashboard.module.css'

export default function Dashboard() {
    const { user } = useAuth()
    const {
        balances,
        groups,
        friends,
        fetchBalances,
        fetchGroups,
        fetchFriends,
        addExpense,
        settleUp
    } = useApp()

    const navigate = useNavigate()
    const [showAdd, setShowAdd] = useState(false)
    const [showSettle, setShowSettle] = useState(false)
    const [loadingBalances, setLoadingBalances] =
        useState(true)

    useEffect(() => {
        const load = async () => {
            setLoadingBalances(true)
            await Promise.all([
                fetchBalances(),
                fetchGroups(),
                fetchFriends()
            ])
            setLoadingBalances(false)
        }
        load()
    }, [])

    // ── Split balances into owed and owe ──
    const owedToMe = balances.filter(
        b => parseFloat(b.netAmount) > 0.01)
    const iOwe = balances.filter(
        b => parseFloat(b.netAmount) < -0.01)

    // ── Totals ──
    const totalOwed = owedToMe.reduce(
        (s, b) => s + parseFloat(b.netAmount), 0)
    const totalOwe = iOwe.reduce(
        (s, b) => s + Math.abs(parseFloat(b.netAmount)), 0)
    const netBalance = totalOwed - totalOwe

    const handleAddExpense = async (payload) => {
        await addExpense(payload)
        await fetchBalances()
    }

    const allFriendsAndMembers = (() => {
        const map = new Map()
        friends.forEach(f => {
            if (f.id !== user?.id) map.set(f.id, f)
        })
        groups.forEach(g => {
            g.members?.forEach(m => {
                if (m.id !== user?.id &&
                        !map.has(m.id)) {
                    map.set(m.id, m)
                }
            })
        })
        return Array.from(map.values())
    })()

    return (
        <div className={styles.page}>

            {/* ── Top greeting ── */}
            <div className={styles.greeting}>
                <div>
                    <h1 className={styles.greetTitle}>
                        Hey, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className={styles.greetSub}>
                        Here's your balance summary
                    </p>
                </div>
                <div className={styles.topActions}>
                    <button
                        className={styles.btnPrimary}
                        onClick={() => setShowAdd(true)}
                    >
                        + Add Expense
                    </button>
                    <button
                        className={styles.btnSettle}
                        onClick={() => setShowSettle(true)}
                    >
                        Settle Up
                    </button>
                </div>
            </div>

            {/* ── Balance summary cards ── */}
            <div className={styles.summaryCards}>

                {/* Total you are owed */}
                <div className={`${styles.summaryCard} ${styles.summaryGreen}`}>
                    <div className={styles.summaryLabel}>
                        Total you are owed
                    </div>
                    <div className={styles.summaryAmount}>
                        {formatCurrency(totalOwed)}
                    </div>
                    <div className={styles.summaryCount}>
                        from {owedToMe.length} {owedToMe.length === 1
                            ? 'person' : 'people'}
                    </div>
                </div>

                {/* Net balance */}
                <div className={`${styles.summaryCard} ${styles.summaryNet} ${netBalance >= 0
                    ? styles.summaryNetPos
                    : styles.summaryNetNeg}`}>
                    <div className={styles.summaryLabel}>
                        Net balance
                    </div>
                    <div className={styles.summaryAmount}>
                        {netBalance >= 0
                            ? formatCurrency(netBalance)
                            : `-${formatCurrency(
                                Math.abs(netBalance))}`}
                    </div>
                    <div className={styles.summaryCount}>
                        {netBalance >= 0
                            ? 'overall you get back'
                            : 'overall you owe'}
                    </div>
                </div>

                {/* Total you owe */}
                <div className={`${styles.summaryCard} ${styles.summaryRed}`}>
                    <div className={styles.summaryLabel}>
                        Total you owe
                    </div>
                    <div className={styles.summaryAmount}>
                        {formatCurrency(totalOwe)}
                    </div>
                    <div className={styles.summaryCount}>
                        to {iOwe.length} {iOwe.length === 1
                            ? 'person' : 'people'}
                    </div>
                </div>

            </div>

            {/* ── Main balance section ── */}
            <div className={styles.balanceSection}>

                {loadingBalances ? (
                    <div className={styles.loading}>
                        Loading balances…
                    </div>
                ) : balances.length === 0 ? (
                    <div className={styles.allSettled}>
                        <div className={styles.settledIcon}>
                            🎉
                        </div>
                        <h3 className={styles.settledTitle}>
                            All settled up!
                        </h3>
                        <p className={styles.settledSub}>
                            You have no outstanding balances.
                            Add an expense to get started.
                        </p>
                        <button
                            className={styles.btnPrimary}
                            onClick={() => setShowAdd(true)}
                        >
                            + Add Expense
                        </button>
                    </div>
                ) : (
                    <div className={styles.twoCol}>

                        {/* ── LEFT — You Are Owed ── */}
                        <div className={styles.owedCol}>
                            <div className={styles.colHeader}>
                                <span className={styles.colTitleGreen}>
                                    YOU ARE OWED
                                </span>
                                {owedToMe.length > 0 && (
                                    <span className={styles.colTotal}>
                                        {formatCurrency(totalOwed)}
                                    </span>
                                )}
                            </div>

                            {owedToMe.length === 0 ? (
                                <div className={styles.emptyCol}>
                                    You are not owed anything
                                </div>
                            ) : (
                                owedToMe.map((b, i) => (
                                    <div
                                        key={i}
                                        className={styles.personRow}
                                    >
                                        <Avatar
                                            name={b.friendName}
                                            size={40}
                                        />
                                        <div className={styles.personInfo}>
                                            <div className={
                                                styles.personName}>
                                                {b.friendName}
                                            </div>
                                            <div className={`${styles.personAmt} ${styles.amtGreen}`}>
                                                owes you{' '}
                                                {formatCurrency(
                                                    parseFloat(b.netAmount))}
                                            </div>
                                            <div className={
                                                styles.groupBreakdown}>
                                                {groups
                                                    .filter(g =>
                                                        g.members?.some(m =>
                                                            m.id === b.friendId))
                                                    .map(g => g.name)
                                                    .join(', ')}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* ── Center divider ── */}
                        <div className={styles.centerDivider} />

                        {/* ── RIGHT — You Owe ── */}
                        <div className={styles.oweCol}>
                            <div className={styles.colHeader}>
                                <span className={styles.colTitleRed}>
                                    YOU OWE
                                </span>
                                {iOwe.length > 0 && (
                                    <span className={styles.colTotal}>
                                        {formatCurrency(totalOwe)}
                                    </span>
                                )}
                            </div>

                            {iOwe.length === 0 ? (
                                <div className={styles.emptyCol}>
                                    You don't owe anything
                                </div>
                            ) : (
                                iOwe.map((b, i) => (
                                    <div
                                        key={i}
                                        className={styles.personRow}
                                    >
                                        <Avatar
                                            name={b.friendName}
                                            size={40}
                                        />
                                        <div className={styles.personInfo}>
                                            <div className={
                                                styles.personName}>
                                                {b.friendName}
                                            </div>
                                            <div className={`${styles.personAmt} ${styles.amtRed}`}>
                                                you owe{' '}
                                                {formatCurrency(
                                                    Math.abs(
                                                        parseFloat(
                                                            b.netAmount)))}
                                            </div>
                                            <div className={
                                                styles.groupBreakdown}>
                                                {groups
                                                    .filter(g =>
                                                        g.members?.some(m =>
                                                            m.id === b.friendId))
                                                    .map(g => g.name)
                                                    .join(', ')}
                                            </div>
                                        </div>
                                        <button
                                            className={styles.settleBtn}
                                            onClick={e => {
                                                e.stopPropagation()
                                                setShowSettle(true)
                                            }}
                                        >
                                            Settle
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Groups summary ── */}
            {groups.length > 0 && (
                <div className={styles.groupsSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            Your Groups
                        </h2>
                        <button
                            className={styles.seeAll}
                            onClick={() =>
                                navigate('/groups')}
                        >
                            See all →
                        </button>
                    </div>
                    <div className={styles.groupCards}>
                        {groups.slice(0, 4).map(g => (
                            <div
                                key={g.id}
                                className={styles.groupCard}
                                onClick={() =>
                                    navigate(
                                        `/groups/${g.id}`)}
                            >
                                <div className={
                                    styles.groupEmoji}>
                                    {g.emoji || '👥'}
                                </div>
                                <div className={
                                    styles.groupCardInfo}>
                                    <div className={
                                        styles.groupCardName}>
                                        {g.name}
                                    </div>
                                    <div className={
                                        styles.groupCardMeta}>
                                        {g.members?.length
                                            || 0} members
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Modals ── */}
            {showAdd && (
                <AddExpenseModal
                    onClose={() => setShowAdd(false)}
                    onSave={handleAddExpense}
                    friends={allFriendsAndMembers}
                    groups={groups}
                />
            )}

            {showSettle && (
                <SettleUpModal
                    onClose={() => setShowSettle(false)}
                    balances={balances}
                    onSettle={async (friendId, amount) => {
                        await settleUp(
                            friendId, amount, null)
                        await fetchBalances()
                        setShowSettle(false)
                    }}
                />
            )}
        </div>
    )
}