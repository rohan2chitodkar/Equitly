import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Auth.module.css'

export default function Login() {
    const { login, loading } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!email.trim()) {
            setError('Please enter your email')
            return
        }
        if (!password) {
            setError('Please enter your password')
            return
        }

        const result = await login(email.trim(), password)
        if (result === true) {
            navigate('/')
        }
        // Error is handled inside AuthContext and shown via toast
        // but we also catch specific messages here
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>

                {/* Logo */}
                <div className={styles.logo}>
                    Equi<span>tly</span>
                </div>

                <h1 className={styles.heading}>Welcome back</h1>
                <p className={styles.sub}>Sign in to your account</p>

                {/* Error box */}
                {error && (
                    <div className={styles.errorBox}>
                        ⚠️ {error}
                    </div>
                )}

                <form className={styles.form} onSubmit={handleSubmit}>

                    {/* Email */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email</label>
                        <input
                            className={styles.input}
                            type="email"
                            value={email}
                            onChange={e => {
                                setEmail(e.target.value)
                                setError('')
                            }}
                            placeholder="you@email.com"
                            autoFocus
                        />
                    </div>

                    {/* Password */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <div className={styles.inputWrap}>
                            <input
                                className={styles.input}
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => {
                                    setPassword(e.target.value)
                                    setError('')
                                }}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() =>
                                    setShowPassword(p => !p)}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button
                        className={styles.btnPrimary}
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <p className={styles.footer}>
                    Don't have an account?{' '}
                    <Link to="/register" className={styles.link}>
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}