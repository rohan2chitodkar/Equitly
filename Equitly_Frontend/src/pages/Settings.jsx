import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosConfig'
import toast from 'react-hot-toast'
import styles from './Settings.module.css'

export default function Settings() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [currency, setCurrency] = useState(user?.currency || 'INR')
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/users/me', { name, currency })
      toast.success('Settings saved!')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePassword = async () => {
    if (!oldPwd || !newPwd) return
    setSavingPwd(true)
    try {
      await api.put('/users/me/password', { oldPassword: oldPwd, newPassword: newPwd })
      toast.success('Password updated!')
      setOldPwd('')
      setNewPwd('')
    } catch {
      toast.error('Incorrect current password')
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.cardHeader}><h2 className={styles.cardTitle}>Profile</h2></div>
        <div className={styles.cardBody}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Name</label>
            <input className={styles.input} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input className={styles.input} value={user?.email || ''} disabled />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Default Currency</label>
            <select className={styles.select} value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="INR">₹ INR — Indian Rupee</option>
              <option value="USD">$ USD — US Dollar</option>
              <option value="EUR">€ EUR — Euro</option>
              <option value="GBP">£ GBP — British Pound</option>
            </select>
          </div>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: 18 }}>
        <div className={styles.cardHeader}><h2 className={styles.cardTitle}>Change Password</h2></div>
        <div className={styles.cardBody}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Current Password</label>
            <input className={styles.input} type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>New Password</label>
            <input className={styles.input} type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
          </div>
          <button className={styles.btnPrimary} onClick={handlePassword} disabled={savingPwd}>
            {savingPwd ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  )
}
