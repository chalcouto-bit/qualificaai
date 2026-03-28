import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Topbar.css'

export default function Topbar({ title, subtitle }) {
    const { user } = useAuth()
    const navigate = useNavigate()
    const emailPrefix = user?.email?.split('@')[0] || 'Usuário'
    const userName = user?.user_metadata?.full_name || emailPrefix
    const avatarUrl = user?.user_metadata?.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=f0f7ff&color=0D1F4F&rounded=true&bold=true&size=64`

    return (
        <header className="topbar">
            <div className="topbar-left">
                <img src="/logo.png" alt="QualificaAI" className="topbar-logo" />
                <div className="topbar-titles">
                    {title && <span className="topbar-title">{title}</span>}
                    {subtitle && <span className="topbar-subtitle">{subtitle}</span>}
                </div>
            </div>

            <div className="topbar-right">
                <button
                    className="topbar-user-btn"
                    onClick={() => navigate('/perfil')}
                    title="Editar Perfil"
                >
                    <img
                        className="topbar-avatar"
                        src={avatarUrl}
                        alt="Avatar"
                    />
                    <span className="topbar-username">{userName}</span>
                </button>
            </div>
        </header>
    )
}
