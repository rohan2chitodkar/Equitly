import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/formatCurrency'
import styles from './Topbar.module.css'

export default function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = () => {
    setShowMenu(false)
    logout()
    navigate('/login')
  }

  const handleCreateGroup = () => {
    setShowMenu(false)
    navigate('/groups')
  }

  const handleAccount = () => {
    setShowMenu(false)
    navigate('/settings')
  }

  return (
    <header className={styles.topbar}>
      {/* Logo */}
      <div className={styles.logo}>Equi<span>tly</span></div>

      {/* Right side — Avatar + Name */}
      <div className={styles.right}>
        <div className={styles.profileWrap} onClick={() => setShowMenu(m => !m)}>

          {/* Avatar circle with initials */}
          <div className={styles.avatar}>
            {getInitials(user?.name || 'U')}
          </div>

          {/* Full name next to avatar */}
          <span className={styles.userName}>{user?.name || 'User'}</span>

          {/* Dropdown arrow */}
          <span className={styles.arrow}>{showMenu ? '▲' : '▼'}</span>
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            {/* Backdrop to close menu when clicking outside */}
            <div className={styles.backdrop} onClick={() => setShowMenu(false)} />

            <div className={styles.menu}>
              {/* Your Account */}
              <button className={styles.menuItem} onClick={handleAccount}>
                <span className={styles.menuIcon}>👤</span>
                Your Account
              </button>

              {/* Create a Group */}
              <button className={styles.menuItem} onClick={handleCreateGroup}>
                <span className={styles.menuIcon}>👥</span>
                Create a Group
              </button>

              <hr className={styles.menuDivider} />

              {/* Log Out */}
              <button className={`${styles.menuItem} ${styles.logout}`} onClick={handleLogout}>
                <span className={styles.menuIcon}>🚪</span>
                Log Out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}