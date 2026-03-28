import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import './ProfilePage.css'

// Redimensiona e comprime a imagem para base64 pequena (~50KB max)
function resizeImageToBase64(file, maxSize = 200) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const ratio = Math.min(maxSize / img.width, maxSize / img.height)
                canvas.width = img.width * ratio
                canvas.height = img.height * ratio
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                resolve(canvas.toDataURL('image/jpeg', 0.8))
            }
            img.onerror = reject
            img.src = e.target.result
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

export default function ProfilePage() {
    const { user } = useAuth()
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
    const [role, setRole] = useState(user?.user_metadata?.role || '')
    const [avatarPreview, setAvatarPreview] = useState(user?.user_metadata?.avatar_url || null)
    const [avatarBase64, setAvatarBase64] = useState(null)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)
    const fileRef = useRef(null)

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3500)
    }

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
            showToast('Imagem muito grande. Máximo 5MB.', 'error')
            return
        }
        try {
            const base64 = await resizeImageToBase64(file, 200)
            setAvatarBase64(base64)
            setAvatarPreview(base64)
        } catch {
            showToast('Erro ao processar imagem. Tente outra.', 'error')
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const updates = {
                full_name: fullName,
                role,
            }
            if (avatarBase64) {
                updates.avatar_url = avatarBase64
            }

            const { error } = await supabase.auth.updateUser({ data: updates })
            if (error) throw error
            setAvatarBase64(null)
            showToast('✅ Perfil atualizado com sucesso!')
        } catch (err) {
            showToast(err.message || 'Erro ao salvar perfil.', 'error')
        } finally {
            setSaving(false)
        }
    }


    const userName = user?.email?.split('@')[0] || 'Usuário'
    const displayAvatar = avatarPreview ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D1F4F&color=fff&rounded=true&bold=true&size=128`

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-area">
                <Topbar title="Meu Perfil" subtitle="Gerencie sua conta e preferências" />

                <div className="page-content">
                    <div className="profile-grid">

                        {/* Card Avatar */}
                        <div className="card profile-avatar-card">
                            <div className="avatar-wrapper">
                                <img
                                    src={displayAvatar}
                                    alt="Foto de Perfil"
                                    className="profile-avatar-img"
                                />
                                <button
                                    type="button"
                                    className="avatar-change-btn"
                                    onClick={() => fileRef.current?.click()}
                                    title="Alterar foto"
                                >
                                    📷
                                </button>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleAvatarChange}
                                />
                            </div>
                            <p className="avatar-name">{fullName || userName}</p>
                            <p className="avatar-email">{user?.email}</p>
                            {avatarBase64 && (
                                <p className="avatar-pending">
                                    ✏️ Nova foto selecionada. Salve para confirmar.
                                </p>
                            )}
                        </div>

                        {/* Card Dados */}
                        <div className="card profile-data-card">
                            <h2 className="profile-section-title">Informações Pessoais</h2>

                            <div className="input-group">
                                <label htmlFor="fullName">Nome Completo</label>
                                <div className="input-wrapper">
                                    <span className="icon">👤</span>
                                    <input
                                        id="fullName"
                                        type="text"
                                        placeholder="Seu nome completo"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="email">Email</label>
                                <div className="input-wrapper input-readonly">
                                    <span className="icon">✉️</span>
                                    <input
                                        id="email"
                                        type="email"
                                        value={user?.email || ''}
                                        readOnly
                                    />
                                    <span className="badge-verified">✓ Verificado</span>
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="role">Cargo / Função</label>
                                <div className="input-wrapper">
                                    <span className="icon">💼</span>
                                    <input
                                        id="role"
                                        type="text"
                                        placeholder="Ex: Vendedor, Representante, Gerente..."
                                        value={role}
                                        onChange={e => setRole(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="profile-actions">
                                <button
                                    className="btn btn-primary btn-block"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? <><span className="spinner" /> Salvando...</> : '💾 Salvar Alterações'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
            </div>
        </div>
    )
}
