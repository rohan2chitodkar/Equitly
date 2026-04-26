import { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import ExpenseList from '../components/expenses/ExpenseList'
import styles from './Dashboard.module.css'

export default function AllExpenses() {
  const { expenses, friends, groups, fetchExpenses, loadingExpenses } = useApp()

  useEffect(() => {
    fetchExpenses()
  }, [])

  return (
    <div>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>All Expenses</h2>
        </div>
        <div className={styles.cardBody}>
          {loadingExpenses ? (
            <div className={styles.loading}>Loading expenses…</div>
          ) : (
            <ExpenseList
              expenses={expenses}
              friends={friends}
              groups={groups}
            />
          )}
        </div>
      </div>
    </div>
  )
}