const supabase = require('../lib/supabaseClient');

/**
 * Middleware de Autenticação via Supabase JWT.
 * Verifica o token Bearer e anexa req.user ao request.
 */
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Token de autenticação não fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        console.log('[Auth] Validando token:', token.substring(0, 15) + '...');
        const { data, error } = await supabase.auth.getUser(token);
        console.log('[Auth] Retorno do Supabase:', { error, hasUser: !!data?.user });

        if (error || !data?.user) {
            return res.status(401).json({ success: false, error: 'Token inválido ou expirado.' });
        }

        req.user = data.user;
        next();
    } catch (err) {
        console.error('[Auth Middleware Error]', err);
        return res.status(500).json({ success: false, error: 'Erro interno ao validar autenticação.' });
    }
}

module.exports = authMiddleware;
