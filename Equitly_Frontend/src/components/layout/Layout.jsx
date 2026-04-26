import { Outlet } from 'react-router-dom'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import styles from './Layout.module.css'

export default function Layout() {
  return (
    <div className={styles.root}>
      <Topbar />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
