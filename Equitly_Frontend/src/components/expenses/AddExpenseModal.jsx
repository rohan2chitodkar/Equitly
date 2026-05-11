import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import Modal from '../common/Modal'
import { formatCurrency, CATEGORY_EMOJI } from '../../utils/formatCurrency'
import styles from './AddExpenseModal.module.css'

const CATEGORIES = [
    { value: 'food', label: '🍔 Food' },
    { value: 'travel', label: '✈️ Travel' },
    { value: 'housing', label: '🏠 Housing' },
    { value: 'entertainment', label: '🎬 Entertainment' },
    { value: 'shopping', label: '🛍️ Shopping' },
    { value: 'utilities', label: '💡 Utilities' },
    { value: 'health', label: '🏥 Health' },
    { value: 'other', label: '📌 Other' },
]

const SPLIT_TYPES = [
    { value: 'equal', label: 'Equally' },
    { value: 'exact', label: 'Unequally' },
    { value: 'percentage', label: 'By %' },
    { value: 'shares', label: 'By Shares' },
    { value: 'adjustment', label: 'Adjustment' },
]

export default function AddExpenseModal({
    onClose,
    onSave,
    friends = [],
    initialGroupId = null,
    expense = null
}) {
    const { user } = useAuth()
    const isEdit = !!expense

    // ── Basic fields ──
    const [desc, setDesc] = useState(
        expense?.description || '')
    const [amount, setAmount] = useState(
        expense?.amount?.toString() || '')
    const [category, setCategory] = useState(
        expense?.category || 'food')

    // ── Paid by — support multiple payers ──
    const [paidByType, setPaidByType] = useState(
        'single') // 'single' or 'multiple'
    const [paidById, setPaidById] = useState(
        expense?.paidBy?.id || user?.id || '')

    // Multiple payer amounts
    const [paidByAmounts, setPaidByAmounts] = useState({})

    // ── Split fields ──
    const [splitType, setSplitType] = useState(
        expense?.splitType
            ? expense.splitType.toLowerCase()
            : 'equal')

    // All people
    const allPeople = useMemo(() => {
        const people = []
        if (user) people.push({
            id: user.id, name: 'You'
        })
        friends.forEach(f => {
            if (f.id !== user?.id) {
                people.push({ id: f.id, name: f.name })
            }
        })
        return people
    }, [user, friends])

    // Selected participants
    const [selectedIds, setSelectedIds] = useState(() => {
        if (expense?.splits?.length > 0) {
            return expense.splits
                .map(s => s.userId || s.user?.id)
                .filter(Boolean)
        }
        return allPeople.map(p => p.id)
    })

    // Custom split values
    const [customValues, setCustomValues] = useState(() => {
        if (!expense?.splits) return {}
        const vals = {}
        expense.splits.forEach(s => {
            const uid = s.userId || s.user?.id
            if (uid) vals[uid] = parseFloat(s.amount) || 0
        })
        return vals
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const totalAmount = parseFloat(amount) || 0

    const selectedPeople = allPeople.filter(p =>
        selectedIds.includes(p.id))

    const togglePerson = (personId) => {
        setSelectedIds(prev =>
            prev.includes(personId)
                ? prev.filter(id => id !== personId)
                : [...prev, personId]
        )
    }

    // ── Multiple payer calculations ──
    const totalPaidByMultiple = Object.values(paidByAmounts)
        .reduce((s, v) => s + (parseFloat(v) || 0), 0)
    const multiplePayerRemaining =
        totalAmount - totalPaidByMultiple

    // ── Split calculations ──
    const equalShare = selectedPeople.length > 0
        ? totalAmount / selectedPeople.length : 0

    const exactTotal = selectedIds.reduce(
        (s, id) => s + (parseFloat(customValues[id]) || 0), 0)
    const exactRemaining = totalAmount - exactTotal

    const percentTotal = selectedIds.reduce(
        (s, id) => s + (parseFloat(customValues[id]) || 0), 0)
    const percentRemaining = 100 - percentTotal

    const totalShares = selectedIds.reduce(
        (s, id) => s + (parseFloat(customValues[id]) || 0), 0)

    const adjustmentTotal = selectedIds.reduce(
        (s, id) => s + (parseFloat(customValues[id]) || 0), 0)

    // ── Preview splits ──
    const previewSplits = useMemo(() => {
        if (!totalAmount || selectedPeople.length === 0)
            return []
        return selectedPeople.map(person => {
            let share = 0
            switch (splitType) {
                case 'equal':
                    share = totalAmount / selectedPeople.length
                    break
                case 'exact':
                    share = parseFloat(
                        customValues[person.id]) || 0
                    break
                case 'percentage':
                    share = totalAmount *
                        (parseFloat(
                            customValues[person.id]) || 0) / 100
                    break
                case 'shares': {
                    const myShares = parseFloat(
                        customValues[person.id]) || 0
                    share = totalShares > 0
                        ? totalAmount * myShares / totalShares
                        : 0
                    break
                }
                case 'adjustment':
                    share = equalShare +
                        (parseFloat(
                            customValues[person.id]) || 0)
                    break
                default:
                    share = totalAmount / selectedPeople.length
            }
            return { ...person, share }
        })
    }, [splitType, totalAmount, selectedPeople,
        customValues, totalShares, equalShare])

    // ── Validate ──
    const validate = () => {
        if (!desc.trim()) {
            setError('Please enter a description')
            return false
        }
        if (!amount || totalAmount <= 0) {
            setError('Please enter a valid amount')
            return false
        }
        if (selectedIds.length === 0) {
            setError('Select at least one person')
            return false
        }
        if (paidByType === 'multiple') {
            if (Math.abs(multiplePayerRemaining) > 0.01) {
                setError(
                    `Paid amounts must add up to ${formatCurrency(totalAmount)}. ` +
                    `${multiplePayerRemaining > 0
                        ? formatCurrency(multiplePayerRemaining) + ' remaining'
                        : formatCurrency(Math.abs(multiplePayerRemaining)) + ' over'}`
                )
                return false
            }
        }
        if (splitType === 'exact') {
            if (Math.abs(exactRemaining) > 0.01) {
                setError(
                    `Amounts must add up to ${formatCurrency(totalAmount)}. ` +
                    `${exactRemaining > 0
                        ? formatCurrency(exactRemaining) + ' left'
                        : formatCurrency(Math.abs(exactRemaining)) + ' over'}`
                )
                return false
            }
        }
        if (splitType === 'percentage') {
            if (Math.abs(percentRemaining) > 0.01) {
                setError(
                    `Percentages must add up to 100%. ` +
                    `${percentRemaining > 0
                        ? percentRemaining.toFixed(1) + '% left'
                        : Math.abs(percentRemaining).toFixed(1) + '% over'}`
                )
                return false
            }
        }
        if (splitType === 'shares' && totalShares <= 0) {
            setError('Please enter shares for each person')
            return false
        }
        if (splitType === 'adjustment') {
            if (Math.abs(adjustmentTotal) > 0.01) {
                setError(
                    `Adjustments must sum to zero. Currently: ` +
                    `${adjustmentTotal > 0 ? '+' : ''}${adjustmentTotal.toFixed(2)}`
                )
                return false
            }
        }
        return true
    }

    // ── Submit ──
    const handleSubmit = async () => {
        if (!validate()) return
        setError('')

        let finalPaidById = paidById
        if (paidById === 'you' || !paidById) {
            finalPaidById = user.id
        }

        // Build splits
        const splits = previewSplits
            .filter(p => {
                if (splitType === 'shares') {
                    return (parseFloat(
                        customValues[p.id]) || 0) > 0
                }
                return true
            })
            .map(p => ({
                userId: p.id,
                amount: parseFloat(p.share.toFixed(2))
            }))

        const payload = {
            description: desc.trim(),
            amount: totalAmount,
            category,
            paidById: paidByType === 'single'
                ? finalPaidById
                : user.id, // default to first payer for multiple
            groupId: initialGroupId || null,
            splitType: splitType.toUpperCase(),
            splits
        }

        setLoading(true)
        try {
            await onSave(payload)
            onClose()
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to save expense'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            title={isEdit ? 'Edit Expense' : 'Add Expense'}
            onClose={onClose}
            footer={
                <>
                    <button
                        className={styles.btnOutline}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.btnPrimary}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Saving…'
                            : isEdit ? 'Save Changes'
                            : 'Add Expense'}
                    </button>
                </>
            }
        >
            {/* Error */}
            {error && (
                <div className={styles.errorBox}>
                    ⚠️ {error}
                </div>
            )}

            {/* Description */}
            <div className={styles.field}>
                <label className={styles.label}>
                    Description
                </label>
                <input
                    className={styles.input}
                    value={desc}
                    onChange={e => {
                        setDesc(e.target.value)
                        setError('')
                    }}
                    placeholder="What was this for?"
                    autoFocus
                />
            </div>

            {/* Amount */}
            <div className={styles.field}>
                <label className={styles.label}>
                    Amount
                </label>
                <div className={styles.amountWrap}>
                    <span className={styles.currency}>
                        ₹
                    </span>
                    <input
                        className={`${styles.input} ${styles.amountInput}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={e => {
                            setAmount(e.target.value)
                            setError('')
                        }}
                        placeholder="0.00"
                    />
                </div>
            </div>

            {/* Category */}
            <div className={styles.field}>
                <label className={styles.label}>
                    Category
                </label>
                <div className={styles.categoryGrid}>
                    {CATEGORIES.map(c => (
                        <button
                            key={c.value}
                            type="button"
                            className={`${styles.categoryBtn} ${category === c.value
                                ? styles.categoryActive
                                : ''}`}
                            onClick={() =>
                                setCategory(c.value)}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Paid by */}
            <div className={styles.field}>
                <label className={styles.label}>
                    Paid by
                </label>

                {/* Toggle single / multiple */}
                <div className={styles.paidByToggle}>
                    <button
                        type="button"
                        className={`${styles.paidByTab} ${paidByType === 'single'
                            ? styles.paidByTabActive : ''}`}
                        onClick={() =>
                            setPaidByType('single')}
                    >
                        Single person
                    </button>
                    <button
                        type="button"
                        className={`${styles.paidByTab} ${paidByType === 'multiple'
                            ? styles.paidByTabActive : ''}`}
                        onClick={() =>
                            setPaidByType('multiple')}
                    >
                        Multiple people
                    </button>
                </div>

                {/* Single payer dropdown */}
                {paidByType === 'single' && (
                    <select
                        className={styles.select}
                        value={paidById}
                        onChange={e =>
                            setPaidById(e.target.value)}
                    >
                        {allPeople.map(p => (
                            <option
                                key={p.id}
                                value={p.id}
                            >
                                {p.name}
                            </option>
                        ))}
                    </select>
                )}

                {/* Multiple payers */}
                {paidByType === 'multiple' && (
                    <div className={styles.multiPayer}>
                        {/* Remaining indicator */}
                        <div className={`${styles.remaining} ${Math.abs(multiplePayerRemaining) < 0.01
                            ? styles.remainingOk
                            : multiplePayerRemaining < 0
                                ? styles.remainingOver
                                : styles.remainingLeft}`}
                        >
                            {Math.abs(
                                multiplePayerRemaining
                            ) < 0.01
                                ? '✅ Total matches'
                                : multiplePayerRemaining > 0
                                    ? `${formatCurrency(multiplePayerRemaining)} remaining`
                                    : `${formatCurrency(Math.abs(multiplePayerRemaining))} over`
                            }
                        </div>

                        {allPeople.map(p => (
                            <div
                                key={p.id}
                                className={styles.inputRow}
                            >
                                <span className={
                                    styles.inputName}>
                                    {p.name}
                                </span>
                                <div className={
                                    styles.inputWrap}>
                                    <span className={
                                        styles.inputPrefix}>
                                        ₹
                                    </span>
                                    <input
                                        className={
                                            styles.splitInput}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={
                                            paidByAmounts[p.id]
                                            || ''
                                        }
                                        onChange={e => {
                                            setPaidByAmounts(
                                                prev => ({
                                                    ...prev,
                                                    [p.id]: parseFloat(
                                                        e.target.value
                                                    ) || 0
                                                })
                                            )
                                            setError('')
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Split with */}
            <div className={styles.field}>
                <label className={styles.label}>
                    Split with
                </label>
                <div className={styles.peopleChips}>
                    {allPeople.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            className={`${styles.personChip} ${selectedIds.includes(p.id)
                                ? styles.personChipActive
                                : ''}`}
                            onClick={() =>
                                togglePerson(p.id)}
                        >
                            {selectedIds.includes(p.id)
                                ? '✓ ' : ''}{p.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Split type */}
            <div className={styles.field}>
                <label className={styles.label}>
                    Split type
                </label>
                <div className={styles.splitTabs}>
                    {SPLIT_TYPES.map(t => (
                        <button
                            key={t.value}
                            type="button"
                            className={`${styles.splitTab} ${splitType === t.value
                                ? styles.splitTabActive
                                : ''}`}
                            onClick={() => {
                                setSplitType(t.value)
                                setCustomValues({})
                                setError('')
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Equal preview */}
            {splitType === 'equal' &&
                totalAmount > 0 && (
                <div className={styles.splitPreview}>
                    <div className={styles.previewTitle}>
                        Each person pays
                    </div>
                    {selectedPeople.map(p => (
                        <div
                            key={p.id}
                            className={styles.previewRow}
                        >
                            <span className={
                                styles.previewName}>
                                {p.name}
                            </span>
                            <span className={
                                styles.previewAmt}>
                                {formatCurrency(equalShare)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Exact / Unequal */}
            {splitType === 'exact' && (
                <div className={styles.splitInputs}>
                    <div className={`${styles.remaining} ${Math.abs(exactRemaining) < 0.01
                        ? styles.remainingOk
                        : exactRemaining < 0
                            ? styles.remainingOver
                            : styles.remainingLeft}`}
                    >
                        {Math.abs(exactRemaining) < 0.01
                            ? '✅ All distributed'
                            : exactRemaining > 0
                                ? `${formatCurrency(exactRemaining)} left`
                                : `${formatCurrency(Math.abs(exactRemaining))} over`
                        }
                    </div>
                    {selectedPeople.map(p => (
                        <div
                            key={p.id}
                            className={styles.inputRow}
                        >
                            <span className={
                                styles.inputName}>
                                {p.name}
                            </span>
                            <div className={
                                styles.inputWrap}>
                                <span className={
                                    styles.inputPrefix}>
                                    ₹
                                </span>
                                <input
                                    className={
                                        styles.splitInput}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={
                                        customValues[p.id]
                                        || ''
                                    }
                                    onChange={e => {
                                        setCustomValues(
                                            prev => ({
                                                ...prev,
                                                [p.id]: parseFloat(
                                                    e.target.value
                                                ) || 0
                                            })
                                        )
                                        setError('')
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Percentage */}
            {splitType === 'percentage' && (
                <div className={styles.splitInputs}>
                    <div className={`${styles.remaining} ${Math.abs(percentRemaining) < 0.01
                        ? styles.remainingOk
                        : percentRemaining < 0
                            ? styles.remainingOver
                            : styles.remainingLeft}`}
                    >
                        {Math.abs(percentRemaining) < 0.01
                            ? '✅ 100% distributed'
                            : percentRemaining > 0
                                ? `${percentRemaining.toFixed(1)}% remaining`
                                : `${Math.abs(percentRemaining).toFixed(1)}% over`
                        }
                    </div>
                    {selectedPeople.map(p => {
                        const pct = parseFloat(
                            customValues[p.id]) || 0
                        const amt = totalAmount * pct / 100
                        return (
                            <div
                                key={p.id}
                                className={styles.inputRow}
                            >
                                <span className={
                                    styles.inputName}>
                                    {p.name}
                                </span>
                                <div className={
                                    styles.inputWrap}>
                                    <input
                                        className={
                                            styles.splitInput}
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        placeholder="0"
                                        value={
                                            customValues[p.id]
                                            || ''
                                        }
                                        onChange={e => {
                                            setCustomValues(
                                                prev => ({
                                                    ...prev,
                                                    [p.id]: parseFloat(
                                                        e.target.value
                                                    ) || 0
                                                })
                                            )
                                            setError('')
                                        }}
                                    />
                                    <span className={
                                        styles.inputSuffix}>
                                        %
                                    </span>
                                </div>
                                {totalAmount > 0
                                    && pct > 0 && (
                                    <span className={
                                        styles.pctAmount}>
                                        = {formatCurrency(amt)}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Shares */}
            {splitType === 'shares' && (
                <div className={styles.splitInputs}>
                    <div className={styles.sharesInfo}>
                        Total shares:{' '}
                        <strong>{totalShares}</strong>
                        {totalAmount > 0
                            && totalShares > 0 && (
                            <span> · {formatCurrency(
                                totalAmount / totalShares
                            )} per share</span>
                        )}
                    </div>
                    {selectedPeople.map(p => {
                        const myShares = parseFloat(
                            customValues[p.id]) || 0
                        const myAmt = totalShares > 0
                            ? totalAmount * myShares
                                / totalShares
                            : 0
                        const isZero = myShares === 0
                        return (
                            <div
                                key={p.id}
                                className={`${styles.inputRow} ${isZero
                                    ? styles.inputRowDisabled
                                    : ''}`}
                            >
                                <span className={
                                    styles.inputName}>
                                    {p.name}
                                    {isZero && (
                                        <span className={
                                            styles.excludedBadge}>
                                            excluded
                                        </span>
                                    )}
                                </span>
                                <div className={
                                    styles.inputWrap}>
                                    <input
                                        className={
                                            styles.splitInput}
                                        type="number"
                                        min="0"
                                        step="1"
                                        placeholder="0"
                                        value={
                                            customValues[p.id]
                                            || ''
                                        }
                                        onChange={e => {
                                            setCustomValues(
                                                prev => ({
                                                    ...prev,
                                                    [p.id]: parseFloat(
                                                        e.target.value
                                                    ) || 0
                                                })
                                            )
                                            setError('')
                                        }}
                                    />
                                    <span className={
                                        styles.inputSuffix}>
                                        shares
                                    </span>
                                </div>
                                {!isZero && totalAmount > 0
                                    && totalShares > 0 && (
                                    <span className={
                                        styles.pctAmount}>
                                        = {formatCurrency(
                                            myAmt)}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Adjustment */}
            {splitType === 'adjustment' && (
                <div className={styles.splitInputs}>
                    <div className={styles.adjustInfo}>
                        Base: {formatCurrency(equalShare)} each.
                        Enter + or - adjustments
                        (must sum to zero).
                    </div>
                    <div className={`${styles.remaining} ${Math.abs(adjustmentTotal) < 0.01
                        ? styles.remainingOk
                        : styles.remainingOver}`}
                    >
                        {Math.abs(adjustmentTotal) < 0.01
                            ? '✅ Adjustments balanced'
                            : `Sum: ${adjustmentTotal > 0
                                ? '+' : ''}${adjustmentTotal.toFixed(2)} (must be 0)`
                        }
                    </div>
                    {selectedPeople.map(p => {
                        const adj = parseFloat(
                            customValues[p.id]) || 0
                        const finalAmt = equalShare + adj
                        return (
                            <div
                                key={p.id}
                                className={styles.inputRow}
                            >
                                <span className={
                                    styles.inputName}>
                                    {p.name}
                                    <span className={
                                        styles.baseAmt}>
                                        {formatCurrency(
                                            equalShare)}
                                    </span>
                                </span>
                                <div className={
                                    styles.inputWrap}>
                                    <input
                                        className={
                                            styles.splitInput}
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={
                                            customValues[p.id]
                                            || ''
                                        }
                                        onChange={e => {
                                            setCustomValues(
                                                prev => ({
                                                    ...prev,
                                                    [p.id]: parseFloat(
                                                        e.target.value
                                                    ) || 0
                                                })
                                            )
                                            setError('')
                                        }}
                                    />
                                </div>
                                <span className={
                                    styles.pctAmount}>
                                    = {formatCurrency(
                                        Math.max(0, finalAmt))}
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}
        </Modal>
    )
}