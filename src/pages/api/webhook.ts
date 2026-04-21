import type { APIRoute } from 'astro';
import { processWebhookEvent, verifyWebhookSignature } from '@/lib/webhook-handler';

/**
 * GET /api/webhook
 * Endpoint untuk verifikasi webhook dari Meta
 * Meta akan mengirim request GET dengan query parameters:
 * - hub.mode=subscribe
 * - hub.challenge=token
 * - hub.verify_token=token_yang_digenerate
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const challenge = url.searchParams.get('hub.challenge');
    const verifyToken = url.searchParams.get('hub.verify_token');

    // Check if all parameters are present
    if (!mode || !challenge || !verifyToken) {
      return new Response('Missing required parameters', { status: 400 });
    }

    // Check if the mode is "subscribe"
    if (mode !== 'subscribe') {
      return new Response('Invalid mode', { status: 400 });
    }

    // Check if verify token matches
    const expectedToken = process.env.META_VERIFY_TOKEN;
    if (verifyToken !== expectedToken) {
      return new Response('Invalid verify token', { status: 403 });
    }

    // Return the challenge
    return new Response(challenge, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error handling webhook verification:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

/**
 * POST /api/webhook
 * Endpoint untuk menerima events dari Meta
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';

    // Verify webhook signature
    const appSecret = process.env.META_APP_SECRET || process.env.META_VERIFY_TOKEN || '';
    const isDev = process.env.NODE_ENV === 'development';
    
    // In development mode, if we can't verify signature but request is valid JSON, we accept it for testing
    const isValidSignature = verifyWebhookSignature(body, signature, appSecret);
    
    if (!isValidSignature) {
      console.warn('Invalid webhook signature detected.');
      if (!isDev) {
        return new Response('Forbidden', { status: 403 });
      } else {
        console.warn('Development mode: Bypassing signature verification for testing purposes.');
      }
    }

    // Parse the event
    const event = JSON.parse(body);

    // Process the event asynchronously (don't wait)
    processWebhookEvent(event).catch((error) => {
      console.error('Error processing webhook event:', error);
    });

    // Return 200 OK immediately to Meta
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
