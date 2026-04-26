import { useState } from 'react'
import Modal from '../common/Modal'
import { calculateSplits } from '../../utils/splitCalculator'
import { useAuth } from '../../context/AuthContext'
import styles from './AddExpenseModal.module.css'

const CATEGORIES = [
  { value: 'food', label: '🍔 Food & Drink' },
  { value: 'travel', label: '✈️ Travel' },
  { value: 'house', label: '🏠 Housing' },
  { value: 'entertainment', label: '🎬 Entertainment' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'utilities', label: '💡 Utilities' },
  { value: 'health', label: '🏥 Health' },
  { value: 'other', label: '📌 Other' },
]

const SPLIT_TYPES = [
  { value: 'equal', label: 'Equally' },
  { value: 'exact', label: 'Exact amounts' },
  { value: 'percentage', label: 'Percentages' },
  { value: 'shares', label: 'Shares' },
]

export default function AddExpenseModal({ onClose, onSave, friends = [], groups = [], initialGroupId = null, expense = null }) {
  const { user } = useAuth()
  const isEdit = !!expense

  const allPeople = [
    { id: user?.id, name: `You (${user?.name})` },
    ...friends.map(f => ({ id: f.id, name: f.name }))
  ]

  const [desc, setDesc] = useState(expense?.description || '')
  const [amount, setAmount] = useState(expense?.amount || '')
  const [category, setCategory] = useState(expense?.category || 'food')
  const [paidById, setPaidById] = useState(
      expense?.paidBy?.id || user?.id || ''
  )
  const [groupId, setGroupId] = useState(
      expense?.group?.id || initialGroupId || ''
  )
  const [splitType, setSplitType] = useState(
      expense?.splitType
          ? expense.splitType.toLowerCase()
          : 'equal'
  )
  const [selectedIds, setSelectedIds] = useState(() => {
      if (expense?.splits && expense.splits.length > 0) {
          return expense.splits
              .map(s => s.userId || s.user?.id)
              .filter(Boolean)
      }
      return Array.isArray(friends) ? friends.map(f => f.id) : []
  })
  const [customValues, setCustomValues] = useState(() => {
      if (!expense || !expense.splits) return {}
      const vals = {}
      expense.splits.forEach(s => {
          const uid = s.userId || s.user?.id
          if (uid) vals[uid] = parseFloat(s.amount) || 0
      })
      return vals
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')        // ← this was missing

  const participants = [user?.id, ...selectedIds.filter(id => id !== user?.id)]

  const togglePerson = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    // Basic validation
    if (!desc.trim()) {
        setError('Please enter a description')
        return
    }
    if (!amount || parseFloat(amount) <= 0) {
        setError('Please enter a valid amount')
        return
    }
    if (!user?.id) {
        setError('User session expired. Please log in again.')
        return
    }

    setError('')

    // Use real user ID — never use placeholder 'you'
    const realPaidById = paidById === 'you' ? user.id : paidById

    // Build unique participants
    const participantIds = [
        realPaidById,
        ...selectedIds.filter(id =>
            id !== realPaidById && id !== 'you'
        )
    ]
    const uniqueParticipants = [...new Set(participantIds)]

    // ── Validate custom split types ──
    if (splitType === 'percentage') {
        const total = uniqueParticipants.reduce(
            (s, id) => s + (parseFloat(customValues[id]) || 0), 0
        )
        if (Math.abs(total - 100) > 0.01) {
            setError(
                `Percentages must add up to 100%. ` +
                `Currently: ${total.toFixed(1)}%`
            )
            return
        }
    }

    if (splitType === 'exact') {
        const total = uniqueParticipants.reduce(
            (s, id) => s + (parseFloat(customValues[id]) || 0), 0
        )
        if (Math.abs(total - parseFloat(amount)) > 0.01) {
            setError(
                `Exact amounts must add up to ₹${amount}. ` +
                `Currently: ₹${total.toFixed(2)}`
            )
            return
        }
    }

    if (splitType === 'shares') {
        const total = uniqueParticipants.reduce(
            (s, id) => s + (parseFloat(customValues[id]) || 0), 0
        )
        if (total <= 0) {
            setError('Please enter shares for each person')
            return
        }
    }

    // Calculate splits
    let splits
    try {
        splits = calculateSplits(
            parseFloat(amount),
            uniqueParticipants,
            splitType,
            customValues
        )
    } catch (e) {
        setError('Error calculating splits: ' + e.message)
        return
    }

    const payload = {
        description: desc.trim(),
        amount: parseFloat(amount),
        category,
        paidById: realPaidById,
        groupId: groupId || null,
        splitType: splitType.toUpperCase(),
        splits: Object.entries(splits).map(([userId, amt]) => ({
            userId,
            amount: amt
        }))
    }

    console.log('Sending payload:', JSON.stringify(payload, null, 2))

    setLoading(true)
    try {
        await onSave(payload)
        onClose()
    } catch (err) {
        console.error('Expense error:', err.response?.data)
        setError(
            err.response?.data?.message ||
            'Failed to save expense. Please try again.'
        )
    } finally {
        setLoading(false)
    }
  }

  const footer = (
    <>
      <button className={styles.btnOutline} onClick={onClose}>Cancel</button>
      <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Expense'}
      </button>
    </>
  )

  return (
    <Modal title={isEdit ? 'Edit Expense' : 'Add Expense'} onClose={onClose} footer={footer}>
      {error && (
        <div className={styles.errorBox}>
            ⚠️ {error}
        </div>
      )}
      <div className={styles.group}>
        <label className={styles.label}>Description</label>
        <input className={styles.input} value={desc} onChange={e => setDesc(e.target.value)} placeholder="What was this for?" autoFocus />
      </div>

      <div className={styles.row}>
        <div className={styles.group}>
          <label className={styles.label}>Amount (₹)</label>
          <input className={styles.input} type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className={styles.group}>
          <label className={styles.label}>Category</label>
          <select className={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Paid by</label>
        <select className={styles.select} value={paidById} onChange={e => setPaidById(e.target.value)}>
          {allPeople.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {groups.length > 0 && (
        <div className={styles.group}>
          <label className={styles.label}>Group (optional)</label>
          <select className={styles.select} value={groupId} onChange={e => setGroupId(e.target.value)}>
            <option value="">— No group —</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      )}

      <div className={styles.group}>
        <label className={styles.label}>Split with</label>
        <div className={styles.chips}>
          {friends.map(f => (
            <button
              key={f.id}
              type="button"
              className={`${styles.chip} ${selectedIds.includes(f.id) ? styles.chipActive : ''}`}
              onClick={() => togglePerson(f.id)}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Split type</label>
        <div className={styles.splitTabs}>
          {SPLIT_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              className={`${styles.splitTab} ${splitType === t.value ? styles.splitTabActive : ''}`}
              onClick={() => setSplitType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {splitType !== 'equal' && (
        <div className={styles.group}>
          <label className={styles.label}>
            {splitType === 'exact' ? 'Amount per person' : splitType === 'percentage' ? 'Percentage per person' : 'Shares per person'}
          </label>
          {participants.map(id => {
            const person = allPeople.find(p => p.id === id)
            return (
              <div key={id} className={styles.customRow}>
                <span>{person?.name}</span>
                <input
                  className={styles.inputSmall}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={customValues[id] || ''}
                  onChange={e => setCustomValues(prev => ({ ...prev, [id]: parseFloat(e.target.value) || 0 }))}
                />
                {splitType === 'percentage' && <span className={styles.unit}>%</span>}
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
