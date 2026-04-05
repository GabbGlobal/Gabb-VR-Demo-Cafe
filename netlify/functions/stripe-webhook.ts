/**
 * Stripe Webhook handler.
 *
 * Fires when a Stripe checkout session completes.
 * Updates the Netlify Identity user's app_metadata with their subscription tier.
 *
 * Setup in Stripe Dashboard:
 * 1. Go to Developers → Webhooks → Add endpoint
 * 2. URL: https://gabbitalian.netlify.app/.netlify/functions/stripe-webhook
 * 3. Events: checkout.session.completed, customer.subscription.deleted
 * 4. Copy the Signing Secret → add to Netlify env as STRIPE_WEBHOOK_SECRET
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
})

// Netlify Identity Admin API to update user metadata
async function updateUserSubscription(
  email: string,
  subscription: string,
  stripeCustomer: string,
  stripeSubscriptionId: string,
) {
  const siteUrl = process.env.URL ?? 'https://gabbitalian.netlify.app'
  const adminToken = process.env.NETLIFY_IDENTITY_ADMIN_TOKEN

  if (!adminToken) {
    console.error('NETLIFY_IDENTITY_ADMIN_TOKEN not set — cannot update user metadata')
    return
  }

  // Find user by email via Netlify Identity Admin API
  const searchRes = await fetch(
    `${siteUrl}/.netlify/identity/admin/users?email=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  )

  if (!searchRes.ok) {
    console.error('Failed to find user:', await searchRes.text())
    return
  }

  const { users } = await searchRes.json()
  const user = users?.[0]
  if (!user) {
    console.error('No user found with email:', email)
    return
  }

  // Update app_metadata with subscription details
  const updateRes = await fetch(
    `${siteUrl}/.netlify/identity/admin/users/${user.id}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_metadata: {
          ...user.app_metadata,
          subscription,
          stripe_customer: stripeCustomer,
          stripe_subscription: stripeSubscriptionId,
        },
      }),
    }
  )

  if (!updateRes.ok) {
    console.error('Failed to update user:', await updateRes.text())
  } else {
    console.log(`Updated user ${email} → subscription: ${subscription}`)
  }
}

export const handler = async (event: any) => {
  const sig = event.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !sig) {
    return { statusCode: 400, body: 'Missing webhook secret or signature' }
  }

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  try {
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      const email = session.customer_details?.email ?? session.customer_email
      const plan = session.metadata?.plan ?? 'language'
      const customerId = typeof session.customer === 'string' ? session.customer : ''
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : ''

      if (email) {
        await updateUserSubscription(email, plan, customerId, subscriptionId)
      }
    }

    if (stripeEvent.type === 'customer.subscription.deleted') {
      const sub = stripeEvent.data.object as Stripe.Subscription
      const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer
      if (customer.email) {
        await updateUserSubscription(customer.email, 'free', sub.customer as string, '')
      }
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err)
    return { statusCode: 500, body: 'Webhook handler failed' }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}
