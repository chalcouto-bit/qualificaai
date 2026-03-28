import { useState, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import './UploadPage.css'

const API = '/api'

export default function UploadPage() {
    const { session } = useAuth()
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState([])
    const [isDrag, setIsDrag] = useState(false)
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    const fileInput = useRef(null)

    const parsePreview = (file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const text = e.target.result
            const lines = text.trim().split('\n').slice(0, 6)
            setPreview(lines.map(l => l.split(/,|;/).map(c => c.replace(/"/g, '').trim())))
        }
        reader.readAsText(file)
    }

    const handleFile = (f) => {
        if (!f) return
        setFile(f)
        setResult(null)
        setError('')
        parsePreview(f)
    }

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setIsDrag(false)
        const f = e.dataTransfer.files[0]
        if (f) handleFile(f)
    }, [])

    const handleImport = async () => {
        if (!file) return
        setLoading(true)
        setProgress(0)
        setError('')
        setResult(null)

        // Simular progresso
        const interval = setInterval(() => setProgress(p => Math.min(p + 15, 90)), 300)

        try {
            const form = new FormData()
            form.append('file', file)
            const res = await fetch(`${API}/clients/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
                body: form,
            })
            clearInterval(interval)
            setProgress(100)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setResult(data)
        } catch (err) {
            clearInterval(interval)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setFile(null); setPreview([]); setResult(null); setError(''); setProgress(0)
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-area">
                <Topbar title="Upload de Base de Clientes" subtitle="Importe sua planilha CSV" />

                <div className="page-content">
                    <div className="card upload-card">
                        {/* Dropzone */}
                        <div
                            className={`dropzone ${isDrag ? 'drag-over' : ''}`}
                            onDragOver={e => { e.preventDefault(); setIsDrag(true) }}
                            onDragLeave={() => setIsDrag(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInput.current?.click()}
                        >
                            <input ref={fileInput} type="file" accept=".csv" hidden onChange={e => handleFile(e.target.files[0])} />
                            <span className="drop-icon">☁️</span>
                            <p>Arraste e solte sua planilha de clientes aqui (.csv) ou</p>
                            <button className="btn btn-primary" type="button" style={{ pointerEvents: 'none' }}>
                                Procurar Arquivos
                            </button>
                            <p className="drop-hint">Colunas esperadas: <code>codigo_cliente</code>, <code>nome</code></p>
                        </div>

                        {/* Status do arquivo */}
                        {file && (
                            <div className="upload-status">
                                <h4 className="section-title">Status do Upload</h4>
                                <div className="file-status-item">
                                    <div className="file-info">
                                        <span className="file-name">{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                                        <div className="progress-bar-bg">
                                            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                    {result ? (
                                        <span className="status-badge success">✅ Importado com sucesso</span>
                                    ) : error ? (
                                        <span className="status-badge error">❌ Erro</span>
                                    ) : (
                                        <span className="status-badge pending">{progress > 0 ? `${progress}%` : 'Aguardando'}</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Preview da tabela */}
                        {preview.length > 1 && (
                            <div className="preview-section">
                                <h4 className="section-title">Pré-visualização (primeiras 5 linhas)</h4>
                                <div className="preview-table-wrapper">
                                    <table className="preview-table">
                                        <thead>
                                            <tr>{preview[0].map((h, i) => <th key={i}>{h}</th>)}</tr>
                                        </thead>
                                        <tbody>
                                            {preview.slice(1, 6).map((row, i) => (
                                                <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {error && <div className="error-msg" style={{ marginTop: 12 }}>⚠️ {error}</div>}
                        {result && <div className="success-msg" style={{ marginTop: 12 }}>✅ {result.message}</div>}

                        {/* Botões */}
                        {file && !result && (
                            <div className="upload-actions">
                                <button className="btn btn-secondary" onClick={handleCancel} disabled={loading}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleImport} disabled={loading}>
                                    {loading ? <><span className="spinner" /> Importando...</> : 'Importar Dados'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
