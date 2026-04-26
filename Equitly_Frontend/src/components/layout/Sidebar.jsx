import { useState, useEffect, useMemo } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { formatCurrency, getInitials } from '../../utils/formatCurrency'
import Modal from '../common/Modal'
import styles from './Sidebar.module.css'

export default function Sidebar() {
    const {
        balances,
        groups,
        friends,
        fetchGroups,
        fetchFriends,
        fetchBalances,
        addFriend
    } = useApp()

    const navigate = useNavigate()
    const location = useLocation()

    const [showInvite, setShowInvite] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [saving, setSaving] = useState(false)
    const [groupsOpen, setGroupsOpen] = useState(true)
    const [friendsOpen, setFriendsOpen] = useState(true)

    useEffect(() => {
        fetchGroups()
        fetchFriends()
        fetchBalances()
    }, [location.pathname])

    // ── Build combined people list ──
    // Include both friends AND group members
    const allPeople = useMemo(() => {
        const peopleMap = new Map()

        // Add explicit friends first
        if (Array.isArray(friends)) {
            friends.forEach(f => {
                if (f && f.id) peopleMap.set(f.id, f)
            })
        }

        // Add group members from all groups
        if (Array.isArray(groups)) {
            groups.forEach(group => {
                if (Array.isArray(group.members)) {
                    group.members.forEach(m => {
                        if (m && m.id && !peopleMap.has(m.id)) {
                            peopleMap.set(m.id, m)
                        }
                    })
                }
            })
        }

        return Array.from(peopleMap.values())
    }, [friends, groups])

    const totalOwed = balances
        .filter(b => parseFloat(b.netAmount) > 0)
        .reduce((s, b) => s + parseFloat(b.netAmount), 0)

    const totalOwe = balances
        .filter(b => parseFloat(b.netAmount) < 0)
        .reduce((s, b) => s + Math.abs(parseFloat(b.netAmount)), 0)

    const getBalance = (personId) => {
        const bal = balances.find(b => b.friendId === personId)
        return bal ? parseFloat(bal.netAmount) : 0
    }

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return
        setSaving(true)
        try {
            await addFriend(inviteEmail.trim())
            setShowInvite(false)
            setInviteEmail('')
        } finally {
            setSaving(false)
        }
    }

    // Color generator for avatars
    const COLORS = [
        '#1a6b4a', '#3b5bdb', '#e85d3e',
        '#d4830a', '#6741d9', '#0c8599'
    ]
    const colorFor = (name = '') => {
        let hash = 0
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash)
        }
        return COLORS[Math.abs(hash) % COLORS.length]
    }

    return (
        <>
            <aside className={styles.sidebar}>

                {/* ── Main Nav ── */}
                <nav className={styles.nav}>
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `${styles.navItem} ${isActive
                                ? styles.active : ''}`}
                    >
                        <span className={styles.icon}>◎</span>
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/activity"
                        className={({ isActive }) =>
                            `${styles.navItem} ${isActive
                                ? styles.active : ''}`}
                    >
                        <span className={styles.icon}>◷</span>
                        Recent Activity
                    </NavLink>

                    <NavLink
                        to="/expenses"
                        className={({ isActive }) =>
                            `${styles.navItem} ${isActive
                                ? styles.active : ''}`}
                    >
                        <span className={styles.icon}>🧾</span>
                        All Expenses
                    </NavLink>
                </nav>

                {/* ── Groups Section ── */}
                <div className={styles.section}>
                    <div
                        className={styles.sectionHeader}
                        onClick={() => setGroupsOpen(o => !o)}
                    >
                        <span className={styles.sectionLabel}>
                            GROUPS
                        </span>
                        <span className={styles.chevron}>
                            {groupsOpen ? '▾' : '▸'}
                        </span>
                    </div>

                    {groupsOpen && (
                        <div className={styles.sectionBody}>
                            {Array.isArray(groups) &&
                            groups.length > 0 ? (
                                groups.map(g => (
                                    <NavLink
                                        key={g.id}
                                        to={`/groups/${g.id}`}
                                        className={({ isActive }) =>
                                            `${styles.subItem} ${isActive
                                                ? styles.subItemActive
                                                : ''}`}
                                    >
                                        <span className={styles.subIcon}>
                                            {g.emoji || '👥'}
                                        </span>
                                        <span className={styles.subLabel}>
                                            {g.name}
                                        </span>
                                    </NavLink>
                                ))
                            ) : (
                                <div className={styles.emptyNote}>
                                    No groups yet
                                </div>
                            )}

                            <button
                                className={styles.addBtn}
                                onClick={() => navigate('/groups')}
                            >
                                <span className={styles.addIcon}>+</span>
                                Add a Group
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Friends Section ── */}
                <div className={styles.section}>
                    <div
                        className={styles.sectionHeader}
                        onClick={() => setFriendsOpen(o => !o)}
                    >
                        <span className={styles.sectionLabel}>
                            FRIENDS
                        </span>
                        <span className={styles.chevron}>
                            {friendsOpen ? '▾' : '▸'}
                        </span>
                    </div>

                    {friendsOpen && (
                        <div className={styles.sectionBody}>
                            {allPeople.length > 0 ? (
                                allPeople.map(person => {
                                    const bal = getBalance(person.id)
                                    const color = colorFor(
                                        person.name || '')
                                    const initials = getInitials(
                                        person.name || '')

                                    return (
                                        <NavLink
                                            key={person.id}
                                            to="/friends"
                                            className={({ isActive }) =>
                                                `${styles.friendItem} ${isActive
                                                    ? styles.subItemActive
                                                    : ''}`}
                                        >
                                            {/* Avatar */}
                                            <div
                                                className={styles.friendAvatar}
                                                style={{
                                                    background: color
                                                }}
                                            >
                                                {initials}
                                            </div>

                                            {/* Info */}
                                            <div className={
                                                styles.friendInfo}>
                                                <span className={
                                                    styles.friendName}>
                                                    {person.name}
                                                </span>
                                                {Math.abs(bal) > 0.01 && (
                                                    <span className={
                                                        bal > 0
                                                            ? styles.balPos
                                                            : styles.balNeg
                                                    }>
                                                        {bal > 0
                                                            ? `owes ₹${bal.toFixed(0)}`
                                                            : `owe ₹${Math.abs(bal).toFixed(0)}`
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </NavLink>
                                    )
                                })
                            ) : (
                                <div className={styles.emptyNote}>
                                    No friends yet
                                </div>
                            )}

                            {/* Invite Friend */}
                            <button
                                className={styles.inviteBtn}
                                onClick={() => setShowInvite(true)}
                            >
                                <span className={styles.inviteIcon}>
                                    ✉
                                </span>
                                Invite a Friend
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Balance Card ── */}
                <div className={styles.balanceCard}>
                    <div className={styles.balanceLabel}>
                        Your Balance
                    </div>
                    <div className={styles.balanceRow}>
                        <span className={styles.lbl}>
                            You are owed
                        </span>
                        <span className={styles.pos}>
                            {formatCurrency(totalOwed)}
                        </span>
                    </div>
                    <div className={styles.balanceRow}>
                        <span className={styles.lbl}>You owe</span>
                        <span className={styles.neg}>
                            {formatCurrency(totalOwe)}
                        </span>
                    </div>
                </div>

            </aside>

            {/* ── Invite Modal ── */}
            {showInvite && (
                <Modal
                    title="Invite a Friend"
                    onClose={() => setShowInvite(false)}
                    footer={
                        <>
                            <button
                                className={styles.btnOutline}
                                onClick={() => setShowInvite(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.btnPrimary}
                                onClick={handleInvite}
                                disabled={saving}
                            >
                                {saving ? 'Sending…' : 'Send Invite'}
                            </button>
                        </>
                    }
                >
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                            Friend's Email
                        </label>
                        <input
                            className={styles.formInput}
                            type="email"
                            value={inviteEmail}
                            onChange={e =>
                                setInviteEmail(e.target.value)}
                            placeholder="friend@email.com"
                            autoFocus
                            onKeyDown={e =>
                                e.key === 'Enter' && handleInvite()}
                        />
                        <p className={styles.hint}>
                            They need an Equitly account to accept.
                        </p>
                    </div>
                </Modal>
            )}
        </>
    )
}