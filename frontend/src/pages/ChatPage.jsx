import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import './ChatPage.css'

const API = import.meta.env.VITE_API_URL || '/api'

function FichaCard({ content }) {
    return (
        <div className="ficha-card">
            <pre className="ficha-content">{content}</pre>
        </div>
    )
}

function ChatMessage({ msg }) {
    if (msg.role === 'user') {
        return (
            <div className="msg-row user-row">
                <div className="bubble user-bubble">{msg.content}</div>
                <div className="msg-avatar user-avatar">👤</div>
            </div>
        )
    }

    // Detectar se a mensagem contém uma ficha
    const hasFichaContent = msg.content && (
        msg.content.includes('FICHA 5Q') || msg.content.includes('FICHA 3A')
    )

    // Dividir o conteúdo em texto normal e blocos de ficha
    const renderContent = () => {
        if (!hasFichaContent) {
            return <p>{msg.content}</p>
        }

        const lines = msg.content.split('\n')
        const parts = []
        let inFicha = false
        let fichaLines = []

        for (const line of lines) {
            const isFichaHeader = line.includes('FICHA 5Q') || line.includes('FICHA 3A')
            if (isFichaHeader) {
                inFicha = true
                fichaLines = [line]
            } else if (inFicha && line.trim() === '') {
                parts.push(<FichaCard key={parts.length} content={fichaLines.join('\n')} />)
                fichaLines = []
                inFicha = false
            } else if (inFicha) {
                fichaLines.push(line)
            } else {
                parts.push(<p key={parts.length}>{line}</p>)
            }
        }
        if (fichaLines.length > 0) {
            parts.push(<FichaCard key={parts.length} content={fichaLines.join('\n')} />)
        }
        return parts
    }

    return (
        <div className="msg-row ai-row">
            <div className="msg-avatar ai-avatar">🤖</div>
            <div className="bubble ai-bubble">
                {renderContent()}
            </div>
        </div>
    )
}

export default function ChatPage() {
    const { session } = useAuth()

    // Persistindo mensagens no LocalStorage
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('qualificaai_chat_history')
        if (saved) {
            try {
                return JSON.parse(saved)
            } catch (e) {
                return []
            }
        }
        return []
    })

    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

    // Áudio States
    const [isRecording, setIsRecording] = useState(false)
    const [mediaRecorder, setMediaRecorder] = useState(null)
    const [audioLoading, setAudioLoading] = useState(false)

    const bottomRef = useRef(null)

    // Salvar no localstorage sempre que mudar
    useEffect(() => {
        localStorage.setItem('qualificaai_chat_history', JSON.stringify(messages))
    }, [messages])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Função para limpar o chat
    const handleClearChat = () => {
        if (window.confirm('Tem certeza que deseja limpar o histórico desta conversa?')) {
            setMessages([])
            setAwaitingConfirmation(false)
            localStorage.removeItem('qualificaai_chat_history')
        }
    }

    // Gravação de Áudio
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)
            const chunks = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data)
            }

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' })
                stream.getTracks().forEach(t => t.stop())
                await sendAudioMessage(audioBlob)
            }

            recorder.start()
            setMediaRecorder(recorder)
            setIsRecording(true)
        } catch (err) {
            alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop()
            setIsRecording(false)
        }
    }

    const sendAudioMessage = async (audioBlob) => {
        setAudioLoading(true)
        try {
            const formData = new FormData()
            formData.append('audio', audioBlob, 'audio.webm')

            const res = await fetch(`${API}/chat/audio`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
                body: formData,
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            if (data.text) {
                // Envia o texto transcrito diretamente como uma mensagem do usuário
                await sendMessage(data.text)
            }
        } catch (err) {
            alert('Erro ao transcrever áudio: ' + err.message)
        } finally {
            setAudioLoading(false)
        }
    }

    const sendMessage = async (text) => {
        if (!text.trim() || loading) return

        const userMsg = { role: 'user', content: text }
        const updatedMessages = [...messages, userMsg]
        setMessages(updatedMessages)
        setInput('')
        setLoading(true)
        setAwaitingConfirmation(false)

        try {
            const res = await fetch(`${API}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ messages: updatedMessages }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            const aiMsg = { role: 'assistant', content: data.message }
            setMessages(prev => [...prev, aiMsg])

            // Verificar se a IA está pedindo confirmação
            const needsConfirm = data.message?.toLowerCase().includes('posso atualizar o crm')
                || data.message?.toLowerCase().includes('sim/não')
                || data.message?.toLowerCase().includes('sim / não')
            setAwaitingConfirmation(needsConfirm)
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚠️ Erro: ${err.message}. Verifique suas configurações de IA.`,
            }])
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = () => sendMessage('Sim')
    const handleReject = () => sendMessage('Não, quero corrigir')

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage(input)
        }
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-area">
                <Topbar title="Chat Assistente" subtitle="5Q3A — Fluxo de Qualificação" />
                {messages.length > 0 && (
                    <div className="chat-clear-bar">
                        <button className="btn-clear-chat" onClick={handleClearChat}>
                            🗑️ Limpar Conversa
                        </button>
                    </div>
                )}

                <div className="chat-area">
                    <div className="chat-messages">
                        {messages.length === 0 && (
                            <div className="chat-empty">
                                <p>🤖 Olá! Sou o <strong>Assistente 5Q3A</strong>.</p>
                                <p>Diga "quero fazer uma pré-visita" para começar o fluxo 5Q,<br />ou "voltei da visita" para iniciar o fluxo 3A.</p>
                            </div>
                        )}
                        {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
                        {loading && (
                            <div className="msg-row ai-row">
                                <div className="msg-avatar ai-avatar">🤖</div>
                                <div className="bubble ai-bubble typing">
                                    <span /><span /><span />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Botões de confirmação CRM */}
                    {awaitingConfirmation && !loading && (
                        <div className="confirm-row">
                            <button className="btn btn-success" onClick={handleConfirm}>
                                ✅ Sim, Confirmar e Salvar no CRM
                            </button>
                            <button className="btn btn-outline-gray" onClick={handleReject}>
                                ✏️ Não, Quero corrigir
                            </button>
                        </div>
                    )}

                    {/* Input */}
                    <div className="chat-input-bar">
                        <input
                            type="text"
                            placeholder="Digite sua mensagem ou grave um áudio..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            disabled={loading || audioLoading || isRecording}
                        />
                        <button
                            type="button"
                            className={`btn-audio ${isRecording ? 'recording' : ''}`}
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={loading || audioLoading}
                            title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
                        >
                            {audioLoading ? <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> : (isRecording ? '⏹️' : '🎤')}
                        </button>
                        <button
                            className="send-btn"
                            onClick={() => sendMessage(input)}
                            disabled={loading || audioLoading || !input.trim()}
                        >
                            {loading ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : '➤'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
