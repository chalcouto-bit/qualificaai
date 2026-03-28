import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import './HistoryPage.css'

const API = '/api'

const BADGE_COLORS = {
    '5q': { label: 'Pré-visita (5Q)', className: 'badge-5q' },
    '3a': { label: 'Pós-visita (3A)', className: 'badge-3a' },
}

function VisitCard({ visit }) {
    const has5Q = !!visit.resumo_5q
    const has3A = !!visit.resumo_3a
    const type = has3A && !has5Q ? '3a' : '5q'
    const badge = BADGE_COLORS[type]
    const date = new Date(visit.data_criacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

    const renderGrid = (resumo) => (
        <div className="visit-grid">
            {Object.entries(resumo).map(([k, v]) => (
                <div className="grid-item" key={k}>
                    <span className="grid-label">{k.replace(/_/g, ' ')}</span>
                    <span className="grid-value">{v}</span>
                </div>
            ))}
        </div>
    )

    return (
        <div className="visit-card card">
            <div className="visit-header">
                <div>
                    <span className={`badge ${badge.className}`}>{badge.label}</span>
                    {visit.fase_pipeline && <span className="fase">{visit.fase_pipeline}</span>}
                </div>
                <span className="visit-date">{date}</span>
            </div>

            <div className="visit-body">
                {has5Q && (
                    <div className="visit-section section-5q">
                        <h5 className="section-title-small">📝 Pré-visita (5Q)</h5>
                        {renderGrid(visit.resumo_5q)}
                    </div>
                )}
                {has3A && (
                    <div className="visit-section section-3a">
                        <h5 className="section-title-small">🤝 Pós-visita (3A)</h5>
                        {renderGrid(visit.resumo_3a)}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function HistoryPage() {
    const { session } = useAuth()
    const [search, setSearch] = useState('')
    const [visits, setVisits] = useState(null)
    const [clientName, setClientName] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSearch = async () => {
        if (!search.trim()) return
        setLoading(true)
        setError('')
        setVisits(null)
        setClientName(null)
        try {
            const res = await fetch(`${API}/history/${encodeURIComponent(search.trim())}`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setVisits(data.visits)
            setClientName(data.clientName)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-area">
                <Topbar title="Histórico de Clientes" subtitle="Visualize o histórico de visitas" />

                <div className="page-content">
                    {/* Barra de busca */}
                    <div className="history-search-bar">
                        <div className="search-input-wrapper">
                            <span>🔍</span>
                            <input
                                type="text"
                                placeholder="Buscar por Código do Cliente"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                            {loading ? <span className="spinner" /> : 'Pesquisar'}
                        </button>
                    </div>

                    {error && <div className="error-msg">{error}</div>}

                    {visits !== null && (
                        <div className="history-results">
                            <div className="history-header-info">
                                <h3 className="history-title">QualificaAI Customer History</h3>
                                <div className="client-meta">
                                    <span className="meta-code">Cód. {search}</span>
                                    {clientName ? (
                                        <span className="meta-name">{clientName}</span>
                                    ) : (
                                        <span className="meta-name unknown">(Nome não encontrado na base de clientes)</span>
                                    )}
                                </div>
                            </div>

                            {visits.length === 0 ? (
                                <p className="no-results">Nenhum histórico encontrado para este cliente.</p>
                            ) : (
                                <div className="timeline">
                                    {visits.map(visit => (
                                        <div key={visit.id} className="timeline-item">
                                            <div className="timeline-dot" />
                                            <VisitCard visit={visit} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
