const supabase = require('../lib/supabaseClient');

/**
 * GET /api/history/:codigoCliente
 * Retorna o histórico de visitas de um cliente, do mais recente ao mais antigo.
 */
async function getHistory(req, res, next) {
    try {
        const { codigoCliente } = req.params;

        const { data, error } = await supabase
            .from('visits')
            .select('*')
            .eq('codigo_cliente', codigoCliente)
            .eq('user_id', req.user.id)
            .order('data_criacao', { ascending: false });

        if (error) throw error;

        // Buscar o nome do cliente na tabela de clientes
        const { data: clientData } = await supabase
            .from('clients')
            .select('nome')
            .eq('codigo_cliente', codigoCliente)
            .eq('user_id', req.user.id)
            .limit(1);

        const clientName = (clientData && clientData.length > 0) ? clientData[0].nome : null;

        res.json({ success: true, visits: data || [], clientName });
    } catch (err) {
        next(err);
    }
}

module.exports = { getHistory };
