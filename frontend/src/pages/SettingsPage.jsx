import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import './SettingsPage.css'

const API = import.meta.env.VITE_API_URL || '/api'

export default function SettingsPage() {
    const { session } = useAuth()
    const [apiKey, setApiKey] = useState('')
    const [showKey, setShowKey] = useState(false)
    const [maskedKey, setMaskedKey] = useState(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    useEffect(() => {
        const fetchKey = async () => {
            setLoading(true)
            try {
                const res = await fetch(`${API}/settings`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` },
                })
                const data = await res.json()
                if (data.hasKey) setMaskedKey(data.maskedKey)
            } catch { }
            finally { setLoading(false) }
        }
        fetchKey()
    }, [session])

    const handleSave = async () => {
        if (!apiKey.startsWith('sk-')) {
            showToast('Chave inválida. Deve começar com "sk-"', 'error'); return
        }
        setSaving(true)
        try {
            const res = await fetch(`${API}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ api_key: apiKey }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            
            showToast(data.message)
            setMaskedKey(`sk-...${apiKey.slice(-4)}`)
            setApiKey('')
        } catch (err) {
            showToast(err.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-area">
                <Topbar title="Configurações de IA" subtitle="Configure sua chave da OpenAI" />

                <div className="page-content">
                    <div className="card settings-card">
                        <div className="settings-card-header">
                            <h2>Configuração da OpenAI</h2>
                        </div>
                        <div className="settings-card-body">
                            <p className="settings-desc">
                                Insira sua chave de API OpenAI para habilitar o Agente QualificaAI. Esta integração permite
                                que o assistente analise dados da sua frota e gere insights e recomendações personalizadas
                                para otimizar o desempenho das vendas.
                            </p>

                            {maskedKey && !loading && (
                                <div className="current-key">
                                    🔑 Chave atual: <strong>{maskedKey}</strong>
                                </div>
                            )}

                            <div className="input-group" style={{ marginTop: 20 }}>
                                <label htmlFor="apiKey">Chave de API OpenAI</label>
                                <div className="input-wrapper">
                                    <input
                                        id="apiKey"
                                        type={showKey ? 'text' : 'password'}
                                        placeholder="sk-..."
                                        value={apiKey}
                                        onChange={e => setApiKey(e.target.value)}
                                    />
                                    <button className="btn-icon" type="button" onClick={() => setShowKey(!showKey)}>
                                        {showKey ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                <p className="key-hint">Acesse <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">platform.openai.com/api-keys</a> para obter sua chave.</p>
                            </div>

                            <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={handleSave} disabled={saving || !apiKey}>
                                {saving ? <><span className="spinner" /> Salvando...</> : 'Salvar Chave'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
        </div>
    )
}