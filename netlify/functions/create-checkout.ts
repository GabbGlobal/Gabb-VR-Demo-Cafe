/**
 * Netlify Function: create-checkout
 * Creates a Stripe Checkout session and returns the URL.
 *
 * Setup steps for the user:
 * 1. Go to https://dashboard.stripe.com → Products → create two products:
 *    - "Gabb One Language" → $9.99/mo recurring → copy the Price ID (price_xxx)
 *    - "Gabb All Languages" → $14.99/mo recurring → copy the Price ID
 * 2. In Netlify dashboard → Site Settings → Environment Variables, add:
 *    STRIPE_SECRET_KEY = sk_live_xxx (or sk_test_xxx for testing)
 *    STRIPE_PRICE_LANGUAGE = price_xxx  (One Language price ID)
 *    STRIPE_PRICE_ALLACCESS = price_xxx (All Languages price ID)
 *    URL = https://gabbitalian.netlify.app  (your site URL)
 * 3. Deploy — this function will be at /.netlify/functions/create-checkout
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
})

const PRICE_IDS: Record<string, string | undefined> = {
  language:  process.env.STRIPE_PRICE_LANGUAGE,
  allaccess: process.env.STRIPE_PRICE_ALLACCESS,
}

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { plan, email, annual } = JSON.parse(event.body ?? '{}')

    const priceId = PRICE_IDS[plan]
    if (!priceId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid plan' }) }
    }

    const siteUrl = process.env.URL ?? 'https://gabbitalian.netlify.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard?checkout=success&plan=${plan}`,
      cancel_url:  `${siteUrl}/subscribe?checkout=cancelled`,
      customer_email: email ?? undefined,
      subscription_data: {
        trial_period_days: 7,   // 7-day free trial
        metadata: { plan, source: 'gabb-web' },
      },
      metadata: { plan },
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    }
  } catch (err: any) {
    console.error('Stripe error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
