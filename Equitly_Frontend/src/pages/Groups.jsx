import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Modal from '../components/common/Modal'
import styles from './Groups.module.css'

const GROUP_TYPES = [
    { value: '🏠', label: '🏠 Home / Apartment' },
    { value: '✈️', label: '✈️ Trip' },
    { value: '💼', label: '💼 Work' },
    { value: '🎉', label: '🎉 Event' },
    { value: '👥', label: '👥 Other' },
]

export default function Groups() {
    const {
        groups,
        friends,
        fetchGroups,
        fetchFriends,
        addGroup,
        loadingGroups
    } = useApp()

    const location = useLocation()

    const [showCreate, setShowCreate] = useState(false)
    const [name, setName] = useState('')
    const [emoji, setEmoji] = useState('🏠')
    const [selectedFriends, setSelectedFriends] = useState([])
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')

    // Re-fetch every time the page is visited
    useEffect(() => {
    fetchGroups()
    fetchFriends()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
        fetchGroups()
    }, 30000)

    return () => clearInterval(interval)
    }, [location.key])

    const toggleFriend = (id) => {
        setSelectedFriends(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        )
    }

    const handleCreate = async () => {
        if (!name.trim()) return
        setSaving(true)
        try {
            await addGroup({
                name: name.trim(),
                emoji,
                memberIds: selectedFriends
            })
            setShowCreate(false)
            setName('')
            setEmoji('🏠')
            setSelectedFriends([])
            await fetchGroups()
        } finally {
            setSaving(false)
        }
    }

    const handleCloseModal = () => {
        setShowCreate(false)
        setName('')
        setEmoji('🏠')
        setSelectedFriends([])
    }

    // Filter groups by search
    const filteredGroups = Array.isArray(groups)
        ? groups.filter(g =>
            g.name.toLowerCase().includes(search.toLowerCase()))
        : []

    const getTotalOwed = (group) => {
        if (!group.netBalance) return null
        return group.netBalance
    }

    return (
        <div>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Your Groups</h2>
                    <button
                        className={styles.btnPrimary}
                        onClick={() => setShowCreate(true)}
                    >
                        + New Group
                    </button>
                </div>

                {/* Search bar */}
                {Array.isArray(groups) && groups.length > 3 && (
                    <div className={styles.searchWrap}>
                        <input
                            className={styles.searchInput}
                            type="text"
                            placeholder="Search groups..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                )}

                <div className={styles.cardBody}>
                    {loadingGroups ? (
                        <div className={styles.loading}>
                            Loading groups…
                        </div>
                    ) : filteredGroups.length === 0 ? (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}>🏠</div>
                            <p>
                                {search
                                    ? `No groups found for "${search}"`
                                    : 'No groups yet. Create one to start splitting!'}
                            </p>
                            {!search && (
                                <button
                                    className={styles.emptyBtn}
                                    onClick={() => setShowCreate(true)}
                                >
                                    + Create your first group
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredGroups.map(g => {
                            const bal = getTotalOwed(g)
                            return (
                                <Link
                                    key={g.id}
                                    to={`/groups/${g.id}`}
                                    className={styles.groupRow}
                                >
                                    {/* Emoji */}
                                    <div className={styles.groupEmoji}>
                                        {g.emoji}
                                    </div>

                                    {/* Info */}
                                    <div className={styles.groupInfo}>
                                        <div className={styles.groupName}>
                                            {g.name}
                                        </div>
                                        <div className={styles.groupMeta}>
                                            {g.members?.length || 0} member
                                            {(g.members?.length || 0) !== 1 ? 's' : ''}
                                            {' · '}
                                            {g.expenseCount || 0} expense
                                            {(g.expenseCount || 0) !== 1 ? 's' : ''}
                                        </div>
                                    </div>

                                    {/* Balance */}
                                    <div className={styles.groupBalance}>
                                        {bal > 0.01 && (
                                            <span className={styles.pos}>
                                                you get ₹{bal.toFixed(0)}
                                            </span>
                                        )}
                                        {bal < -0.01 && (
                                            <span className={styles.neg}>
                                                you owe ₹{Math.abs(bal).toFixed(0)}
                                            </span>
                                        )}
                                        {(!bal || Math.abs(bal) <= 0.01) && (
                                            <span className={styles.settled}>
                                                settled
                                            </span>
                                        )}
                                    </div>

                                    {/* Arrow */}
                                    <span className={styles.arrow}>›</span>
                                </Link>
                            )
                        })
                    )}
                </div>
            </div>

            {/* ── Create Group Modal ── */}
            {showCreate && (
                <Modal
                    title="Create Group"
                    onClose={handleCloseModal}
                    footer={
                        <>
                            <button
                                className={styles.btnOutline}
                                onClick={handleCloseModal}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.btnPrimary}
                                onClick={handleCreate}
                                disabled={saving || !name.trim()}
                            >
                                {saving ? 'Creating…' : 'Create Group'}
                            </button>
                        </>
                    }
                >
                    {/* Group Name */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Group Name</label>
                        <input
                            className={styles.input}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Goa Trip 2025"
                            autoFocus
                            onKeyDown={e => {
                                if (e.key === 'Enter' && name.trim())
                                    handleCreate()
                            }}
                        />
                    </div>

                    {/* Group Type */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Type</label>
                        <div className={styles.typeGrid}>
                            {GROUP_TYPES.map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    className={`${styles.typeBtn} ${
                                        emoji === t.value
                                            ? styles.typeBtnActive
                                            : ''
                                    }`}
                                    onClick={() => setEmoji(t.value)}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Add Friends */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Add Friends
                            <span className={styles.labelHint}>
                                (optional)
                            </span>
                        </label>
                        {Array.isArray(friends) && friends.length > 0 ? (
                            <div className={styles.chips}>
                                {friends.map(f => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        className={`${styles.chip} ${
                                            selectedFriends.includes(f.id)
                                                ? styles.chipActive
                                                : ''
                                        }`}
                                        onClick={() => toggleFriend(f.id)}
                                    >
                                        {selectedFriends.includes(f.id)
                                            ? '✓ ' : ''}
                                        {f.name}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.noFriends}>
                                No friends added yet. You can add members
                                after creating the group.
                            </p>
                        )}
                    </div>

                    {/* Preview */}
                    {name.trim() && (
                        <div className={styles.preview}>
                            <span className={styles.previewEmoji}>
                                {emoji}
                            </span>
                            <div>
                                <div className={styles.previewName}>
                                    {name}
                                </div>
                                <div className={styles.previewMeta}>
                                    {selectedFriends.length + 1} member
                                    {selectedFriends.length + 1 !== 1
                                        ? 's' : ''} including you
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    )
}