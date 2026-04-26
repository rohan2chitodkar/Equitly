import { getInitials } from '../../utils/formatCurrency'
import styles from './Avatar.module.css'

const COLORS = ['#1a6b4a', '#3b5bdb', '#e85d3e', '#d4830a', '#6741d9', '#0c8599']

function colorFor(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

export default function Avatar({ name = '', size = 36 }) {
  const bg = colorFor(name)
  return (
    <div
      className={styles.avatar}
      style={{ width: size, height: size, fontSize: size * 0.38, background: bg }}
    >
      {getInitials(name)}
    </div>
  )
}
