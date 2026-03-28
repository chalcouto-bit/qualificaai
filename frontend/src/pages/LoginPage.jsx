import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { signIn } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await signIn(email, password)
            navigate('/dashboard')
        } catch (err) {
            setError('Email ou senha incorretos. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = async () => {
        if (!email) { setError('Digite seu email para recuperar a senha.'); return }
        // Importar supabase direto para reset
        const { supabase } = await import('../lib/supabaseClient')
        await supabase.auth.resetPasswordForEmail(email)
        setError('')
        alert('Email de recuperação enviado! Verifique sua caixa de entrada.')
    }

    return (
        <div className="login-layout">
            {/* Painel Esquerdo — Branding Premium */}
            <div className="login-left">
                <div className="login-left-overlay">
                    <div className="hero-content">
                        <div className="hero-logo-wrapper">
                            <img src="/logo.png" alt="QualificaAI" className="hero-logo-img" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Painel Direito — Formulário */}
            <div className="login-right">
                <div className="login-box">
                    <div className="login-header">
                        <div className="login-brand-container">
                            <img src="/logo.png" alt="QualificaAI Logo" className="login-logo-img" />
                            <div className="login-brand">
                                <span className="brand-qualifica">Qualifica</span><span className="brand-ai">AI</span>
                            </div>
                        </div>
                        <h1 className="login-title">Acessar sua conta</h1>
                        <p className="login-subtitle">Entre com suas credenciais para continuar conectando vendas.</p>
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="input-group">
                            <label htmlFor="email">Email</label>
                            <div className="input-wrapper">
                                <span className="icon">✉️</span>
                                <input
                                    id="email" type="email" placeholder="seu.email@empresa.com.br"
                                    value={email} onChange={e => setEmail(e.target.value)} required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Senha</label>
                            <div className="input-wrapper">
                                <span className="icon">🔒</span>
                                <input
                                    id="password" type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password} onChange={e => setPassword(e.target.value)} required
                                />
                                <button type="button" className="btn-icon" onClick={() => setShowPass(!showPass)}>
                                    {showPass ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button
                            type="button" className="login-forgot"
                            onClick={handleForgotPassword}
                        >
                            Esqueceu sua senha?
                        </button>

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? <span className="spinner" /> : 'Entrar'}
                        </button>
                    </form>

                    <p className="login-footer">© 2026 QualificaAI. Todos os direitos reservados. Termos &amp; Privacidade.</p>
                </div>
            </div>
        </div>
    )
}
