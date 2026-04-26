import { useState } from 'react'
import Modal from '../common/Modal'
import Avatar from '../common/Avatar'
import { formatCurrency } from '../../utils/formatCurrency'
import styles from './SettleUpModal.module.css'

export default function SettleUpModal({
    onClose,
    balances,
    onSettle
}) {
    const [loadingId, setLoadingId] = useState(null)
    const [settled, setSettled] = useState([])

    // Only show debts where current user owes someone
    const debts = (balances || []).filter(b =>
        parseFloat(b.netAmount) < -0.01 &&
        !settled.includes(b.friendId)
    )

    const handleSettle = async (balance) => {
        setLoadingId(balance.friendId)
        try {
            await onSettle(
                balance.friendId,
                Math.abs(parseFloat(balance.netAmount))
            )
            // Mark as settled locally
            setSettled(prev => [...prev, balance.friendId])
        } catch (err) {
            console.error('Settle failed:', err)
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <Modal
            title="Settle Up"
            onClose={onClose}
            footer={
                <button
                    className={styles.btnOutline}
                    onClick={onClose}
                >
                    Close
                </button>
            }
        >
            {debts.length === 0 ? (
                <div className={styles.allGood}>
                    <div className={styles.allGoodIcon}>✅</div>
                    <p>
                        {settled.length > 0
                            ? 'All settled up! Great job!'
                            : 'You have no outstanding balances!'}
                    </p>
                </div>
            ) : (
                <div>
                    <p className={styles.subtitle}>
                        You owe the following people:
                    </p>
                    {debts.map((b, i) => (
                        <div key={i} className={styles.row}>
                            <Avatar name={b.friendName} size={36} />
                            <div className={styles.desc}>
                                You owe{' '}
                                <strong>{b.friendName}</strong>
                            </div>
                            <div className={styles.amount}>
                                {formatCurrency(
                                    Math.abs(parseFloat(b.netAmount))
                                )}
                            </div>
                            <button
                                className={styles.btnSettle}
                                disabled={
                                    loadingId === b.friendId
                                }
                                onClick={() => handleSettle(b)}
                            >
                                {loadingId === b.friendId
                                    ? '...'
                                    : 'Settle'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    )
}