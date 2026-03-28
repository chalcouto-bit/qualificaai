require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Checking Supabase Users ---');
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error('Error listing users:', userError);
        return;
    }

    const user = users.users.find(u => u.email === 'chalcouto@gmail.com');
    if (!user) {
        console.log('User chalcouto@gmail.com not found');
        return;
    }

    console.log('User found:', user.email, 'ID:', user.id);

    console.log('\n--- Checking User Settings (API Key) ---');
    const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id_usuario', user.id)
        .single();

    if (settingsError) {
        console.log('Settings error or not found:', settingsError.message);
        return;
    } 
    
    if (!settings.api_key) {
        console.log('API Key field is empty in the database for this user.');
        return;
    }

    console.log('API Key found. Length:', settings.api_key.length);
    console.log('Starts with:', settings.api_key.substring(0, 7) + '...');

    console.log('\n--- Testing OpenAI API Connection ---');
    try {
        const openai = new OpenAI({ apiKey: settings.api_key });
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Say "API Connection Successful"' }],
            max_tokens: 10
        });
        
        console.log('✅ OpenAI API Test Success!');
        console.log('Response:', response.choices[0].message.content);
    } catch (error) {
        console.error('❌ OpenAI API Error:');
        console.error('Status:', error.status);
        console.error('Name:', error.name);
        console.error('Message:', error.message);
        if (error.error) console.error('Details:', error.error);
    }
}

check();
