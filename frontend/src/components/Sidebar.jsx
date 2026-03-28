import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Sidebar.css'

const NAV_ITEMS = [
    { to: '/chat', label: 'Chat Assistente', icon: '💬' },
    { to: '/historico', label: 'Histórico de Clientes', icon: '🕐' },
    { to: '/upload', label: 'Upload de Base', icon: '📤' },
    { to: '/settings', label: 'Configurações de IA', icon: '⚙️' },
]

export default function Sidebar() {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const toggleMenu = () => setIsOpen(!isOpen)
    const closeMenu = () => setIsOpen(false)

    return (
        <>
            <button className="btn-mobile-menu" onClick={toggleMenu}>
                {isOpen ? '✕' : '☰'}
            </button>

            {/* Overlay background para mobile quando menu está aberto */}
            {isOpen && <div className="sidebar-overlay" onClick={closeMenu}></div>}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-brand-container">
                        <img src="/logo.png" alt="QualificaAI Logo" className="sidebar-logo-img" />
                        <div className="sidebar-brand">
                            <span className="brand-qualifica">Qualifica</span><span className="brand-ai">AI</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => isActive ? 'active' : ''}
                            onClick={closeMenu}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <img
                            className="s-avatar"
                            src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email?.split('@')[0] || 'User'}&background=ffffff&color=0D1F4F&rounded=true&bold=true`}
                            alt="Avatar"
                        />
                        <span className="s-email">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</span>
                    </div>
                    <button className="btn-signout" onClick={handleSignOut} title="Sair">
                        <span>↩</span>
                        <span className="signout-label">Sair</span>
                    </button>
                </div>
            </aside>
        </>
    )
}
