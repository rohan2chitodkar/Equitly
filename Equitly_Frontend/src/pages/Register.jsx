import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Auth.module.css'

export default function Register() {
    const { register, loading } = useAuth()
    const navigate = useNavigate()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [errors, setErrors] = useState({})

    const validate = () => {
        const newErrors = {}

        if (!name.trim()) {
            newErrors.name = 'Name is required'
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email'
        }

        if (!password) {
            newErrors.password = 'Password is required'
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters'
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password'
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword =
                'Passwords do not match'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return

        const result = await register(name.trim(), email.trim(), password)
        if (result === true) {
            navigate('/')
        }
    }

    const getPasswordStrength = () => {
        if (!password) return null
        if (password.length < 6) return { label: 'Weak', color: '#e85d3e', width: '30%' }
        if (password.length < 8) return { label: 'Fair', color: '#d4830a', width: '60%' }
        if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
            return { label: 'Strong', color: '#1a6b4a', width: '100%' }
        }
        return { label: 'Good', color: '#1a6b4a', width: '80%' }
    }

    const strength = getPasswordStrength()

    return (
        <div className={styles.page}>
            <div className={styles.card}>

                {/* Logo */}
                <div className={styles.logo}>
                    Equi<span>tly</span>
                </div>

                <h1 className={styles.heading}>Create account</h1>
                <p className={styles.sub}>
                    Start splitting expenses with friends
                </p>

                <form className={styles.form} onSubmit={handleSubmit}>

                    {/* Name */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Full Name</label>
                        <input
                            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                            value={name}
                            onChange={e => {
                                setName(e.target.value)
                                setErrors(p => ({ ...p, name: '' }))
                            }}
                            placeholder="Your full name"
                            autoFocus
                        />
                        {errors.name && (
                            <span className={styles.fieldError}>
                                ⚠️ {errors.name}
                            </span>
                        )}
                    </div>

                    {/* Email */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email</label>
                        <input
                            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                            type="email"
                            value={email}
                            onChange={e => {
                                setEmail(e.target.value)
                                setErrors(p => ({ ...p, email: '' }))
                            }}
                            placeholder="you@email.com"
                        />
                        {errors.email && (
                            <span className={styles.fieldError}>
                                ⚠️ {errors.email}
                            </span>
                        )}
                    </div>

                    {/* Password */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <div className={styles.inputWrap}>
                            <input
                                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => {
                                    setPassword(e.target.value)
                                    setErrors(p => ({
                                        ...p, password: ''
                                    }))
                                }}
                                placeholder="Min. 8 characters"
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowPassword(p => !p)}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.password && (
                            <span className={styles.fieldError}>
                                ⚠️ {errors.password}
                            </span>
                        )}

                        {/* Password strength bar */}
                        {strength && (
                            <div className={styles.strengthWrap}>
                                <div className={styles.strengthBar}>
                                    <div
                                        className={styles.strengthFill}
                                        style={{
                                            width: strength.width,
                                            background: strength.color
                                        }}
                                    />
                                </div>
                                <span
                                    className={styles.strengthLabel}
                                    style={{ color: strength.color }}
                                >
                                    {strength.label}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Confirm Password
                        </label>
                        <div className={styles.inputWrap}>
                            <input
                                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => {
                                    setConfirmPassword(e.target.value)
                                    setErrors(p => ({
                                        ...p, confirmPassword: ''
                                    }))
                                }}
                                placeholder="Re-enter your password"
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowConfirm(p => !p)}
                            >
                                {showConfirm ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <span className={styles.fieldError}>
                                ⚠️ {errors.confirmPassword}
                            </span>
                        )}

                        {/* Match indicator */}
                        {confirmPassword && password && (
                            <span className={
                                password === confirmPassword
                                    ? styles.matchOk
                                    : styles.matchNo
                            }>
                                {password === confirmPassword
                                    ? '✅ Passwords match'
                                    : '❌ Passwords do not match'}
                            </span>
                        )}
                    </div>

                    <button
                        className={styles.btnPrimary}
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? 'Creating account…'
                            : 'Create Account'}
                    </button>
                </form>

                <p className={styles.footer}>
                    Already have an account?{' '}
                    <Link to="/login" className={styles.link}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}