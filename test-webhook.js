import fetch from 'node-fetch';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We changed this to META_APP_SECRET in our earlier step, lets read it to test webhook
const APP_SECRET = process.env.META_APP_SECRET || process.env.META_VERIFY_TOKEN;

const payload = {
  object: 'whatsapp_business_account',
  entry: [{
    id: '12345',
    changes: [{
      value: {
        messaging_product: 'whatsapp',
        metadata: {
          display_phone_number: '1234567890',
          phone_number_id: '1234567890'
        },
        contacts: [{
          profile: { name: 'Test User' },
          wa_id: '6281234567890'
        }],
        messages: [{
          from: '6281234567890',
          id: `wamid.test_${Date.now()}`,
          timestamp: Math.floor(Date.now() / 1000).toString(),
          type: 'text',
          text: { body: 'Ini adalah pesan test dari webhook test script!' }
        }]
      },
      field: 'messages'
    }]
  }]
};

const bodyStr = JSON.stringify(payload);
const hash = crypto.createHmac('sha256', APP_SECRET).update(bodyStr).digest('hex');
const signature = `sha256=${hash}`;

async function testWebhook() {
  try {
    console.log("Sending Webhook Test to localhost:3000/api/webhook...");
    const res = await fetch('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature
      },
      body: bodyStr
    });
    console.log('Status:', res.status);
    console.log('Response:', await res.text());
  } catch(e) {
    console.error('Error:', e);
  }
}

testWebhook();
