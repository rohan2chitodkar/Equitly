import { useState } from 'react'
import ExpenseItem from './ExpenseItem'
import AddExpenseModal from './AddExpenseModal'
import { useApp } from '../../context/AppContext'
import styles from './ExpenseList.module.css'

export default function ExpenseList({
    expenses,
    friends,
    groups,
    groupId,
    onExpensesChange
}) {
    const { updateExpense, deleteExpense } = useApp()
    const [editing, setEditing] = useState(null)

    const handleDelete = async (id) => {
        if (window.confirm('Delete this expense?')) {
            await deleteExpense(id)
            // Notify parent to refresh list
            if (onExpensesChange) onExpensesChange()
        }
    }

    const handleUpdate = async (payload) => {
        await updateExpense(editing.id, payload)
        setEditing(null)
        // Notify parent to refresh list
        if (onExpensesChange) onExpensesChange()
    }

    return (
        <div>
            {!expenses || expenses.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>🧾</div>
                    <p>No expenses yet. Add your first expense!</p>
                </div>
            ) : (
                expenses.map(e => (
                    <ExpenseItem
                        key={e.id}
                        expense={e}
                        onEdit={setEditing}
                        onDelete={handleDelete}
                    />
                ))
            )}

            {editing && (
                <AddExpenseModal
                    expense={editing}
                    onClose={() => setEditing(null)}
                    onSave={handleUpdate}
                    friends={friends}
                    groups={groups}
                    initialGroupId={groupId}
                />
            )}
        </div>
    )
}