import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import './DashboardPage.css'

export default function DashboardPage() {
    const { user } = useAuth()
    const userName = user?.email?.split('@')[0] || 'Usuário'

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-area">
                <Topbar title="Dashboard" subtitle="Bem-vindo ao QualificaAI" />

                <main className="page-content">
                    <div className="welcome-banner">
                        <div>
                            <h2>Bem-vindo, {userName}!</h2>
                            <p>QualificaAI está pronto para suas vendas.</p>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="card stat-card">
                            <p className="stat-label">Total de Clientes:</p>
                            <p className="stat-value">148</p>
                            <p className="stat-sub">Na sua carteira</p>
                        </div>
                        <div className="card stat-card">
                            <p className="stat-label">Interações com IA:</p>
                            <p className="stat-value">32</p>
                            <p className="stat-sub">Últimos 30 dias</p>
                        </div>
                        <div className="card stat-card">
                            <p className="stat-label">Tarefas Pendentes:</p>
                            <p className="stat-value">5</p>
                            <p className="stat-sub">Próximas 48h</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
