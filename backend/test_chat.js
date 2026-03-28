require('dotenv').config();

async function testController() {
    const chatController = require('./src/controllers/chatController');
    
    // Mock req and res
    const req = {
        user: { id: '5fd7d199-14e4-45fe-94b2-9e8529987867' }, // Known user ID from previous check
        body: {
            messages: [{ role: 'user', content: 'Olá, quero fazer uma pré-visita' }]
        }
    };
    
    const res = {
        json: (data) => console.log('RESPONSE:', JSON.stringify(data, null, 2)),
        status: (code) => {
            console.log(`STATUS SET TO: ${code}`);
            return {
                json: (data) => console.log(`ERROR RESPONSE (${code}):`, JSON.stringify(data, null, 2))
            };
        }
    };
    
    const next = (err) => console.error('NEXT ERROR:', err);
    
    console.log('Calling chatController.chat()...');
    await chatController.chat(req, res, next);
}

testController();
