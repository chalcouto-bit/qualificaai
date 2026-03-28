const supabase = require('../lib/supabaseClient');

/**
 * GET /api/settings
 * Retorna a chave OpenAI mascarada do usuário logado.
 */
async function getApiKey(req, res, next) {
    try {
        const { data, error } = await supabase
            .from('user_settings')
            .select('api_key')
            .eq('id_usuario', req.user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (!data?.api_key) {
            return res.json({ success: true, hasKey: false, maskedKey: null });
        }

        // Mascarar a chave: sk-...últimos 4 dígitos
        const key = data.api_key;
        const masked = key.length > 8
            ? `sk-...${key.slice(-4)}`
            : '***';

        res.json({ success: true, hasKey: true, maskedKey: masked });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/settings
 * Body: { api_key: string }
 * Salva ou atualiza a chave OpenAI do usuário.
 */
async function saveApiKey(req, res, next) {
    try {
        const { api_key } = req.body;
        if (!api_key || !api_key.startsWith('sk-')) {
            return res.status(400).json({ success: false, error: 'Chave inválida. Deve começar com "sk-".' });
        }

        const { error } = await supabase
            .from('user_settings')
            .upsert(
                { id_usuario: req.user.id, api_key, updated_at: new Date().toISOString() },
                { onConflict: 'id_usuario' }
            );

        if (error) throw error;

        res.json({ success: true, message: 'Chave OpenAI salva com sucesso!' });
    } catch (err) {
        next(err);
    }
}

module.exports = { getApiKey, saveApiKey };
