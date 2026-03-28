const { parse } = require('csv-parse');
const supabase = require('../lib/supabaseClient');

/**
 * POST /api/clients/upload
 * Recebe um arquivo CSV (codigo_cliente, nome), faz parse e bulk insert.
 */
async function uploadCsv(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado.' });
        }

        const csvContent = req.file.buffer.toString('utf-8');
        const records = [];

        await new Promise((resolve, reject) => {
            parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                bom: true,
                relax_column_count: true,
                skip_records_with_error: true,
                delimiter: [',', ';']
            }, (err, data) => {
                if (err) return reject(err);
                data.forEach(row => {
                    const code = row.codigo_cliente || row['Código do Cliente'] || row['codigo'] || row['code'] || row['Código'] || row['Codigo'];
                    const name = row.nome || row['Nome'] || row['name'] || row['Nome da conta'];
                    if (code && name) {
                        records.push({ codigo_cliente: String(code).trim(), nome: String(name).trim(), user_id: req.user.id });
                    }
                });
                resolve();
            });
        });

        if (records.length === 0) {
            return res.status(400).json({ success: false, error: 'Nenhum registro válido encontrado no CSV. Verifique se as colunas são "codigo_cliente" e "nome".' });
        }

        const { data, error } = await supabase
            .from('clients')
            .upsert(records, { onConflict: 'codigo_cliente', ignoreDuplicates: false });

        if (error) throw error;

        res.json({ success: true, message: `${records.length} clientes importados com sucesso!`, total: records.length });
    } catch (err) {
        next(err);
    }
}

module.exports = { uploadCsv };
