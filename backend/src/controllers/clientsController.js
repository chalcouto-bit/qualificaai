const { parse } = require('csv-parse');
const XLSX = require('xlsx');
const supabase = require('../lib/supabaseClient');

/**
 * Extrai registros de um buffer CSV ou XLSX e retorna array {codigo_cliente, nome, user_id}.
 */
function extractRecords(buffer, mimetype, originalname, userId) {
    const isXlsx = mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        || mimetype === 'application/vnd.ms-excel'
        || originalname?.toLowerCase().endsWith('.xlsx')
        || originalname?.toLowerCase().endsWith('.xls');

    let rows = [];

    if (isXlsx) {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } else {
        // Parse CSV como array de objetos
        const text = buffer.toString('utf-8');
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) return [];
        const headers = lines[0].split(/,|;/).map(h => h.replace(/\"/g, '').trim());
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(/,|;/).map(c => c.replace(/\"/g, '').trim());
            const obj = {};
            headers.forEach((h, idx) => { obj[h] = cols[idx] || ''; });
            rows.push(obj);
        }
    }

    const records = [];
    for (const row of rows) {
        const code = row.codigo_cliente || row['Código do Cliente'] || row['codigo'] || row['code'] || row['Código'] || row['Codigo'] || row['CODIGO_CLIENTE'];
        const name = row.nome || row['Nome'] || row['name'] || row['Nome da conta'] || row['NOME'];
        if (code && name) {
            records.push({ codigo_cliente: String(code).trim(), nome: String(name).trim(), user_id: userId });
        }
    }
    return records;
}

/**
 * POST /api/clients/upload
 * Recebe CSV ou XLSX, faz parse e upsert no Supabase.
 */
async function uploadCsv(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado.' });
        }

        const records = extractRecords(req.file.buffer, req.file.mimetype, req.file.originalname, req.user.id);

        if (records.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Nenhum registro válido encontrado. Certifique-se de que a planilha tem as colunas "codigo_cliente" e "nome".',
            });
        }

        // Insere em lotes de 200 para não estourar o limite
        const BATCH = 200;
        let inserted = 0;
        for (let i = 0; i < records.length; i += BATCH) {
            const batch = records.slice(i, i + BATCH);
            const { error } = await supabase
                .from('clients')
                .upsert(batch, { onConflict: 'codigo_cliente,user_id', ignoreDuplicates: false });
            if (error) throw error;
            inserted += batch.length;
        }

        res.json({ success: true, message: `${inserted} clientes importados com sucesso!`, total: inserted });
    } catch (err) {
        next(err);
    }
}

module.exports = { uploadCsv };
