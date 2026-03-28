const OpenAI = require('openai');
const supabase = require('../lib/supabaseClient');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Prompt de Sistema do Assistente 5Q3A ──────────────────────────────────────
const SYSTEM_PROMPT = `Você é o "Assistente 5Q3A", especialista em produtividade comercial (frotas/Mobil).

REGRAS DE OURO:
1. Uma pergunta por vez. Aguarde a resposta.
2. Se o usuário informar um CÓDIGO de cliente, você deve SEMPRE chamar a função "buscar_cliente_por_codigo" para descobrir o nome real dele antes de seguir. Use o nome nas próximas mensagens.
3. Se for vaga, aprofunde apenas uma vez.
4. Se faltar dado, use "Não informado".
5. Ao final do 5Q e do 3A, gere o resumo da Ficha e peça confirmação: "Posso atualizar o CRM com isso? (Sim/Não)". Se confirmado, chame a ferramenta correspondente para salvar no CRM.

FLUXO 5Q (Pré-Visita):
Colete: Código do Cliente no CRM e Fase do Pipeline.
Faça as 5 perguntas:
5Q1) Qual o MOTIVO da visita?
5Q2) Quais RESULTADOS espera alcançar?
5Q3) Quais INFORMAÇÕES já sabe sobre o cliente?
5Q4) Quais ESTRATÉGIAS usará?
5Q5) Quais OBJEÇÕES podem surgir?
> Gere o resumo "Ficha 5Q". Se o usuário confirmar "Sim", acione a tool update_crm_5q.

FLUXO 3A (Pós-Visita):
Gatilhos: "voltei", "finalizei". Confirme: "Beleza, vamos fechar o 3A do cliente [Nome do Cliente]."
IMPORTANTE ANTES DO 3A: Sempre que o usuário iniciar o fluxo 3A, chame OBRIGATORIAMENTE a ferramenta "buscar_ultima_visita_aberta" passando o código do cliente para ler o que foi discutido na Pré-Visita (5Q). Use as respostas dessa Pré-Visita para guiar de forma inteligente a sua conversa de Pós-Visita com o usuário.
Pergunte:
3A1) Quais informações foram APLICÁVEIS?
3A2) Quais ALINHAMENTOS foram feitos?
3A3) Quais AÇÕES e PRÓXIMOS PASSOS (O quê, quem, quando)?
> Gere o resumo "Ficha 3A". Se o usuário confirmar, acione a tool update_crm_3a. Finalize oferecendo redigir um follow-up.`;

// ── Definição das Tools (Function Calling) ────────────────────────────────────
const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'buscar_ultima_visita_aberta',
            description: 'Busca as informações detalhadas da última Ficha 5Q (Pré-visita) vinculada a um cliente específico.',
            parameters: {
                type: 'object',
                properties: {
                    codigo_cliente: { type: 'string', description: 'O código do cliente (ex: 00108201)' },
                },
                required: ['codigo_cliente'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'buscar_cliente_por_codigo',
            description: 'Busca os dados de um cliente (como o Nome) a partir do seu código no banco de dados.',
            parameters: {
                type: 'object',
                properties: {
                    codigo_cliente: { type: 'string', description: 'O código do cliente (ex: 00108201)' },
                },
                required: ['codigo_cliente'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'update_crm_5q',
            description: 'Salva a Ficha 5Q (pré-visita) no banco de dados CRM após confirmação do usuário.',
            parameters: {
                type: 'object',
                properties: {
                    codigo_cliente: { type: 'string', description: 'Código único do cliente no CRM' },
                    fase_pipeline: { type: 'string', description: 'Fase atual do cliente no pipeline de vendas' },
                    resumo_5q: {
                        type: 'object',
                        description: 'Resumo estruturado da Ficha 5Q',
                        properties: {
                            motivo_visita: { type: 'string' },
                            resultados_esperados: { type: 'string' },
                            informacoes_cliente: { type: 'string' },
                            estrategias: { type: 'string' },
                            possiveis_objecoes: { type: 'string' },
                        },
                    },
                },
                required: ['codigo_cliente', 'fase_pipeline', 'resumo_5q'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'update_crm_3a',
            description: 'Salva a Ficha 3A (pós-visita) no banco de dados CRM após confirmação do usuário.',
            parameters: {
                type: 'object',
                properties: {
                    codigo_cliente: { type: 'string', description: 'Código único do cliente no CRM' },
                    resumo_3a: {
                        type: 'object',
                        description: 'Resumo estruturado da Ficha 3A',
                        properties: {
                            aplicaveis: { type: 'string' },
                            alinhamentos: { type: 'string' },
                            acoes_proximos_passos: { type: 'string' },
                        },
                    },
                },
                required: ['codigo_cliente', 'resumo_3a'],
            },
        },
    },
];

// ── Funções de persistência no Supabase ──────────────────────────────────────
async function buscarCliente(args, userId) {
    const { data: client, error } = await supabase
        .from('clients')
        .select('nome')
        .eq('codigo_cliente', args.codigo_cliente)
        .eq('user_id', userId)
        .single();

    if (error || !client) {
        return `Cliente com código ${args.codigo_cliente} não encontrado no banco de dados. Funciona apenas para clientes já cadastrados.`;
    }
    return `Nome do cliente encontrado: ${client.nome}. Continue a conversa chamando-o pelo nome!`;
}

async function buscarUltimaVisita(args, userId) {
    const { data: visita, error } = await supabase
        .from('visits')
        .select('resumo_5q, data_criacao')
        .eq('codigo_cliente', args.codigo_cliente)
        .eq('user_id', userId)
        .not('resumo_5q', 'is', null)
        .order('data_criacao', { ascending: false })
        .limit(1)
        .single();

    if (error || !visita) {
        return `Nenhuma visita 5Q (Pré-visita) encontrada. Você pode prosseguir o 3A normalmente de forma independente.`;
    }

    return `Última visita 5Q recuperada (feita em ${visita.data_criacao}). As informações do CRM para esse cliente foram: ${JSON.stringify(visita.resumo_5q)}. 
INSTRUÇÃO SECRETA DA IA: Use agressivamente esse contexto que acabei de passar para personalizar as 3 perguntas do 3A e torná-las bem conectadas com a pré-visita!`;
}

async function saveFicha5Q(args, userId) {
    const { error } = await supabase.from('visits').insert({
        codigo_cliente: args.codigo_cliente,
        fase_pipeline: args.fase_pipeline,
        resumo_5q: args.resumo_5q,
        user_id: userId,
    });
    if (error) throw error;
    return `Ficha 5Q do cliente ${args.codigo_cliente} salva com sucesso no CRM!`;
}

async function saveFicha3A(args, userId) {
    const { data: existing } = await supabase
        .from('visits')
        .select('id')
        .eq('codigo_cliente', args.codigo_cliente)
        .eq('user_id', userId)
        .not('resumo_5q', 'is', null)
        .order('data_criacao', { ascending: false })
        .limit(1)
        .single();

    if (existing?.id) {
        const { error } = await supabase
            .from('visits')
            .update({ resumo_3a: args.resumo_3a })
            .eq('id', existing.id);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('visits').insert({
            codigo_cliente: args.codigo_cliente,
            resumo_3a: args.resumo_3a,
            user_id: userId,
        });
        if (error) throw error;
    }
    return `Ficha 3A do cliente ${args.codigo_cliente} salva com sucesso no CRM!`;
}

// ── Controller Principal ──────────────────────────────────────────────────────
async function chat(req, res, next) {
    try {
        const { messages = [] } = req.body;

        const { data: settings, error: settingsError } = await supabase
            .from('user_settings')
            .select('api_key')
            .eq('id_usuario', req.user.id)
            .single();

        if (settingsError || !settings?.api_key) {
            return res.status(400).json({
                success: false,
                error: 'Chave OpenAI não configurada. Acesse "Configurações de IA" para salvar sua chave.',
            });
        }

        const openai = new OpenAI({ apiKey: settings.api_key });

        const fullMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
        ];

        console.log('[CHAT DEBUG] Iniciando chamada para OpenAI:');
        console.log('- Quantidade de mensagens:', fullMessages.length);
        console.log('- Modelo:', 'gpt-4o-mini');
        
        let response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: fullMessages,
            tools: TOOLS,
            tool_choice: 'auto',
        });

        let assistantMessage = response.choices[0].message;

        while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            const toolResultMessages = [];

            fullMessages.push(assistantMessage);

            for (const toolCall of assistantMessage.tool_calls) {
                const fnName = toolCall.function.name;
                let fnArgs = {};
                try {
                    fnArgs = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
                } catch (e) {
                    console.warn(`Fallback: erro ao fazer parse de argumentos da tool ${fnName}:`, e.message);
                }
                let result;

                try {
                    if (fnName === 'buscar_cliente_por_codigo') {
                        result = await buscarCliente(fnArgs, req.user.id);
                    } else if (fnName === 'buscar_ultima_visita_aberta') {
                        result = await buscarUltimaVisita(fnArgs, req.user.id);
                    } else if (fnName === 'update_crm_5q') {
                        result = await saveFicha5Q(fnArgs, req.user.id);
                    } else if (fnName === 'update_crm_3a') {
                        result = await saveFicha3A(fnArgs, req.user.id);
                    } else {
                        result = `Função desconhecida: ${fnName}`;
                    }
                } catch (dbErr) {
                    result = `Erro interno da função: ${dbErr.message}`;
                }

                toolResultMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: result,
                });
            }

            fullMessages.push(...toolResultMessages);

            response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: fullMessages,
                tools: TOOLS,
            });

            assistantMessage = response.choices[0].message;
        }

        res.json({
            success: true,
            message: assistantMessage.content,
            role: 'assistant',
        });
    } catch (err) {
        console.error('\n[CHAT DEBUG] ❌ Erro fatal na requisição OpenAI:');
        console.error('- Mensagem do Erro:', err.message);
        console.error('- Status:', err.status);
        if (err.error) {
            console.error('- Detalhes OpenAI:', JSON.stringify(err.error, null, 2));
        } else {
            console.error('- Stack:', err.stack);
        }

        // Tratar erros específicos da OpenAI
        if (err.status === 401) {
            return res.status(400).json({ success: false, error: 'Chave OpenAI inválida. Verifique nas Configurações de IA.' });
        }
        
        // Retornar o erro real para o frontend ver
        res.status(500).json({ 
            success: false, 
            error: err.error?.message || err.message || 'Erro interno de IA'
        });
    }
}

/**
 * POST /api/chat/audio
 * Recebe arquivo blob via multipart/form-data e envia pro Whisper para transcrever.
 */
async function audioToText(req, res, next) {
    let tempFilePath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Nenhum áudio recebido.' });
        }

        const { data: settings, error: settingsError } = await supabase
            .from('user_settings')
            .select('api_key')
            .eq('id_usuario', req.user.id)
            .single();

        if (settingsError || !settings?.api_key) {
            return res.status(400).json({ success: false, error: 'Chave OpenAI não configurada.' });
        }

        const openai = new OpenAI({ apiKey: settings.api_key });

        // Criar um arquivo temporário para o áudio recebido
        tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.webm`);
        fs.writeFileSync(tempFilePath, req.file.buffer);

        // Chamar Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: 'whisper-1',
            language: 'pt',
        });

        res.json({ success: true, text: transcription.text });
    } catch (err) {
        if (err.status === 401) {
            return res.status(400).json({ success: false, error: 'Chave OpenAI inválida.' });
        }
        next(err);
    } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
    }
}

module.exports = { chat, audioToText };
