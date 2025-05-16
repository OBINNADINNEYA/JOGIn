import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export const SUBSCRIPTION_PRICES = {
  runner: {
    pro: 'price_runner_pro', // Replace with actual Stripe price ID
  },
  leader: {
    pro: 'price_leader_pro', // Replace with actual Stripe price ID
  },
}; 