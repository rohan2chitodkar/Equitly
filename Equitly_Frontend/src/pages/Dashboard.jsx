import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import ExpenseList from '../components/expenses/ExpenseList'
import AddExpenseModal from '../components/expenses/AddExpenseModal'
import SettleUpModal from '../components/friends/SettleUpModal'
import { formatCurrency } from '../utils/formatCurrency'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { expenses, friends, groups, balances, fetchExpenses, fetchFriends, fetchGroups, fetchBalances, addExpense, settleUp, loadingExpenses } = useApp()
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showSettle, setShowSettle] = useState(false)

  useEffect(() => {
    fetchExpenses()
    fetchFriends()
    fetchGroups()
    fetchBalances()
  }, [])

  const totalOwed = balances.filter(b => b.netAmount > 0).reduce((s, b) => s + b.netAmount, 0)
  const totalOwe = balances.filter(b => b.netAmount < 0).reduce((s, b) => s + Math.abs(b.netAmount), 0)
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div>
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Spent</div>
          <div className={styles.statValue}>{formatCurrency(totalSpent)}</div>
          <div className={styles.statSub}>across all expenses</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>You Are Owed</div>
          <div className={`${styles.statValue} ${styles.pos}`}>{formatCurrency(totalOwed)}</div>
          <div className={styles.statSub}>from friends</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>You Owe</div>
          <div className={`${styles.statValue} ${styles.neg}`}>{formatCurrency(totalOwe)}</div>
          <div className={styles.statSub}>to friends</div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Recent Expenses</h2>
          <div className={styles.headerActions}>
            <button className={styles.btnOutline} onClick={() => setShowSettle(true)}>↕ Settle up</button>
            <button className={styles.btnPrimary} onClick={() => setShowAddExpense(true)}>+ Add expense</button>
          </div>
        </div>
        <div className={styles.cardBody}>
          {loadingExpenses ? (
            <div className={styles.loading}>Loading expenses…</div>
          ) : (
            <ExpenseList
              expenses={expenses}
              friends={friends}
              groups={groups}
              onExpensesChange={fetchExpenses}
            />
          )}
        </div>
      </div>

      {showAddExpense && (
        <AddExpenseModal onClose={() => setShowAddExpense(false)} onSave={addExpense} friends={friends} groups={groups} />
      )}
      {showSettle && (
        <SettleUpModal
            onClose={() => setShowSettle(false)}
            balances={balances}
            onSettle={async (friendId, amount) => {
                await settleUp(friendId, amount)
                // Refresh everything
                await fetchBalances()
                await fetchExpenses()
                setShowSettle(false)
            }}
        />
    )}
    </div>
  )
}
