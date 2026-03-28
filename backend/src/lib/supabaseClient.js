const { createClient } = require('@supabase/supabase-js');

// Service Role: permissões totais para operações server-side
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;
