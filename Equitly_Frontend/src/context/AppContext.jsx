import { createContext, useContext, useState, useCallback } from 'react'
import { expenseApi } from '../api/expenseApi'
import { groupApi } from '../api/groupApi'
import { friendApi } from '../api/friendApi'
import { balanceApi } from '../api/balanceApi'
import toast from 'react-hot-toast'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [expenses, setExpenses] = useState([])
  const [groups, setGroups] = useState([])
  const [friends, setFriends] = useState([])
  const [balances, setBalances] = useState([])
  const [activities, setActivities] = useState([])
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)

  // ── Expenses ──
  const fetchExpenses = useCallback(async (groupId = null) => {
    setLoadingExpenses(true)
    try {
        const data = groupId
            ? await expenseApi.getByGroup(groupId)
            : await expenseApi.getAll()
        setExpenses(Array.isArray(data) ? data : [])
    } catch {
        toast.error('Failed to load expenses')
        setExpenses([])
    } finally {
        setLoadingExpenses(false)
    }
  }, [])

  const addExpense = useCallback(async (payload) => {
      try {
          const data = await expenseApi.create(payload)
          // Refresh everything after adding expense
          await Promise.all([
              fetchExpenses(),
              fetchBalances()
          ])
          return data
      } catch (err) {
          toast.error(
              err.response?.data?.message ||
              'Failed to add expense'
          )
          throw err
      }
  }, [])

  const updateExpense = useCallback(async (id, payload) => {
    try {
        const data = await expenseApi.update(id, payload)
        // Update the expense in the list
        setExpenses(prev =>
            prev.map(e => e.id === id ? data : e)
        )
        await fetchBalances()
        toast.success('Expense updated!')
        return data
    } catch (err) {
        toast.error(
            err.response?.data?.message || 'Failed to update expense'
        )
        throw err
    }
  }, [])

  const deleteExpense = useCallback(async (id) => {
    await expenseApi.delete(id)
    setExpenses(prev => prev.filter(e => e.id !== id))
    await fetchBalances()
    toast.success('Expense deleted!')
  }, [])

  // ── Groups ──
  const fetchGroups = useCallback(async () => {
    setLoadingGroups(true)
    try {
        const data = await groupApi.getAll()
        setGroups(Array.isArray(data) ? data : [])
    } catch (err) {
        console.error('Failed to load groups:', err)
        toast.error('Failed to load groups')
        setGroups([])
    } finally {
        setLoadingGroups(false)
    }
  }, [])

  const addGroup = useCallback(async (payload) => {
    const data = await groupApi.create(payload)
    // Re-fetch all groups to refresh sidebar
    await fetchGroups()
    toast.success('Group created!')
    return data
}, [fetchGroups])

  const deleteGroup = useCallback(async (id) => {
    await groupApi.delete(id)
    setGroups(prev => prev.filter(g => g.id !== id))
    toast.success('Group deleted!')
  }, [])

  // ── Friends ──
  const fetchFriends = useCallback(async () => {
    try {
        const data = await friendApi.getAll()
        setFriends(Array.isArray(data) ? data : [])
    } catch {
        toast.error('Failed to load friends')
        setFriends([])
    }
  }, [])

  const addFriend = useCallback(async (email) => {
    const data = await friendApi.add(email)
    setFriends(prev => [...prev, data])
    toast.success('Friend added!')
    return data
  }, [])

  const removeFriend = useCallback(async (friendId) => {
    await friendApi.remove(friendId)
    setFriends(prev => prev.filter(f => f.id !== friendId))
    toast.success('Friend removed!')
  }, [])

  // ── Balances ──
  const fetchBalances = useCallback(async () => {
    try {
        const data = await balanceApi.getAll()
        setBalances(Array.isArray(data) ? data : [])
    } catch {
        toast.error('Failed to load balances')
        setBalances([])
    }
  }, [])

  const settleUp = useCallback(async (friendId, amount,
                                      groupId = null) => {
      try {
          await balanceApi.settle({ friendId, amount, groupId })
          await fetchBalances()
          toast.success('Settled up successfully!')
      } catch (err) {
          toast.error(
              err.response?.data?.message || 'Failed to settle up'
          )
          throw err
      }
  }, [])

  // ── Activity ──
  const fetchActivities = useCallback(async () => {
    try {
        const data = await expenseApi.getActivity()
        setActivities(Array.isArray(data) ? data : [])
    } catch {
        toast.error('Failed to load activity')
        setActivities([])
    }
  }, [])

  return (
    <AppContext.Provider value={{
      expenses, groups, friends, balances, activities,
      loadingExpenses, loadingGroups,
      fetchExpenses, addExpense, updateExpense, deleteExpense,
      fetchGroups, addGroup, deleteGroup,
      fetchFriends, addFriend, removeFriend,
      fetchBalances, settleUp,
      fetchActivities
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
