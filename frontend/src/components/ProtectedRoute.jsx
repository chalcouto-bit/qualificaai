import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, borderColor: 'rgba(13,31,79,0.2)', borderTopColor: '#0D1F4F' }} />
            </div>
        )
    }

    return user ? children : <Navigate to="/login" replace />
}
