import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import styles from './ReceiptModal.module.css'

export default function ReceiptModal({
    expense,
    onClose,
    onUpdate
}) {
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    const hasReceipt = !!expense.receiptFilename
    const baseUrl = import.meta.env
        .VITE_API_BASE_URL ||
        'http://localhost:8081/api'
    const receiptUrl = hasReceipt
        ? `${baseUrl}/files/receipt/${expense.receiptFilename}`
        : null

    const handleFileSelect = async (file) => {
        if (!file) return
        if (!file.type.startsWith('image/') &&
                file.type !== 'application/pdf') {
            toast.error('Only images and PDFs allowed')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File must be less than 5MB')
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const token = localStorage.getItem(
                'se_token')
            const res = await fetch(
                `${baseUrl}/files/receipt/${expense.id}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            )
            if (!res.ok) throw new Error(
                'Upload failed')
            toast.success('Receipt uploaded!')
            if (onUpdate) onUpdate()
        } catch {
            toast.error('Failed to upload receipt')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div
            className={styles.overlay}
            onClick={e =>
                e.target === e.currentTarget &&
                onClose()}
        >
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        🧾 Receipt
                    </h2>
                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.body}>
                    {hasReceipt ? (
                        <div className={
                            styles.receiptView}>
                            <img
                                src={receiptUrl}
                                alt="Receipt"
                                className={
                                    styles.receiptImg}
                            />
                            <div className={
                                styles.receiptActions}>
                                <a                                
                                    href={receiptUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={
                                        styles.viewBtn}
                                >
                                    View Full Size
                                </a>
                                <button
                                    className={
                                        styles.replaceBtn}
                                    onClick={() =>
                                        fileInputRef
                                        .current
                                        ?.click()}
                                >
                                    Replace
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={
                                styles.uploadArea}
                            onClick={() =>
                                fileInputRef
                                .current?.click()}
                        >
                            {uploading ? (
                                <div className={
                                    styles.uploading}>
                                    <div className={
                                        styles.spinner}
                                    />
                                    <p>Uploading…</p>
                                </div>
                            ) : (
                                <div className={
                                    styles.uploadPrompt}>
                                    <div className={
                                        styles.uploadIcon}>
                                        📷
                                    </div>
                                    <p className={
                                        styles.uploadTitle}>
                                        Upload Receipt
                                    </p>
                                    <p className={
                                        styles.uploadSub}>
                                        Click to select
                                        image or PDF
                                    </p>
                                    <p className={
                                        styles.uploadHint}>
                                        Max 5MB
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        style={{ display: 'none' }}
                        onChange={e => {
                            const file =
                                e.target.files?.[0]
                            if (file)
                                handleFileSelect(file)
                            e.target.value = ''
                        }}
                    />
                </div>
            </div>
        </div>
    )
}