import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/common/Modal'
import Avatar from '../components/common/Avatar'
import BalanceTag from '../components/common/BalanceTag'
import SettleUpModal from '../components/friends/SettleUpModal'
import styles from './Friends.module.css'

export default function Friends() {
  const { friends, balances, fetchFriends, fetchBalances, addFriend, removeFriend, settleUp } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [showSettle, setShowSettle] = useState(false)
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchFriends()
    fetchBalances()
  }, [])

  const handleAdd = async () => {
    if (!email.trim()) return
    setSaving(true)
    try {
      await addFriend(email.trim())
      setShowAdd(false)
      setEmail('')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id) => {
    if (window.confirm('Remove this friend?')) await removeFriend(id)
  }

  const getBalance = (friendId) => balances.find(b => b.friendId === friendId)?.netAmount || 0

  return (
    <div>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Friends</h2>
          <div className={styles.headerActions}>
            <button className={styles.btnOutline} onClick={() => setShowSettle(true)}>↕ Settle up</button>
            <button className={styles.btnPrimary} onClick={() => setShowAdd(true)}>+ Add Friend</button>
          </div>
        </div>
        <div className={styles.cardBody}>
          {friends.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>👥</div>
              <p>Add friends to start splitting expenses together!</p>
            </div>
          ) : (
            friends.map(f => {
              const bal = getBalance(f.id)
              return (
                <div key={f.id} className={styles.row}>
                  <Avatar name={f.name} size={40} />
                  <div className={styles.info}>
                    <div className={styles.name}>{f.name}</div>
                    <div className={styles.email}>{f.email}</div>
                  </div>
                  <BalanceTag amount={bal} />
                  <button className={styles.removeBtn} onClick={() => handleRemove(f.id)} title="Remove friend">✕</button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {showAdd && (
        <Modal
          title="Add Friend"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className={styles.btnOutline} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleAdd} disabled={saving}>
                {saving ? 'Adding…' : 'Add Friend'}
              </button>
            </>
          }
        >
          <div className={styles.formGroup}>
            <label className={styles.label}>Friend's Email</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="friend@email.com"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <p className={styles.hint}>They need to have a SplitEase account.</p>
          </div>
        </Modal>
      )}

      {showSettle && (
        <SettleUpModal
            onClose={() => setShowSettle(false)}
            balances={balances}
            onSettle={async (friendId, amount) => {
                await settleUp(friendId, amount)
                // Refresh balances
                await fetchBalances()
                setShowSettle(false)
            }}
        />
    )}
    </div>
  )
}
