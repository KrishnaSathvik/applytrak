# Payment & Subscription Implementation Guide

This guide provides comprehensive instructions for implementing payment and subscription functionality in ApplyTrak. The application has been stripped of all payment-related code, and this guide will help you add it back with modern payment processing capabilities.

## Table of Contents

1. [Overview](#overview)
2. [Manual Payment System (Current Implementation)](#manual-payment-system-current-implementation)
3. [Stripe Integration](#stripe-integration)
4. [Credit Card Processing](#credit-card-processing)
5. [Subscription Management](#subscription-management)
6. [Database Schema](#database-schema)
7. [Frontend Components](#frontend-components)
8. [Backend Services](#backend-services)
9. [Security Considerations](#security-considerations)
10. [Testing](#testing)
11. [Deployment](#deployment)

## Overview

ApplyTrak supports multiple payment methods and subscription tiers:

- **Free Tier**: Basic features, limited applications
- **Pro Tier**: Unlimited applications, advanced analytics, cloud sync
- **Payment Methods**: Manual payments (PayPal, Venmo, Cash App, Zelle), Stripe, Credit Cards

## Manual Payment System (Current Implementation)

The manual payment system allows users to pay via popular peer-to-peer payment apps. This is ideal for small businesses or individual developers who want to avoid payment processor fees.

### Features

- PayPal payments
- Venmo payments  
- Cash App payments
- Zelle payments
- Payment instruction generation
- Email notifications to business owner
- Payment verification workflow

### Implementation Files

Create these files to restore manual payment functionality:

#### 1. Manual Payment Service (`src/services/manualPaymentService.ts`)

```typescript
// Manual Payment Service - Collects payment info and provides manual payment instructions
export type PaymentMethod = 'paypal' | 'venmo' | 'cashapp' | 'zelle';

export interface PayPalInfo {
  email: string;
  accountType: 'personal' | 'business';
}

export interface VenmoInfo {
  username: string;
  phoneNumber?: string;
}

export interface CashAppInfo {
  cashtag: string;
  phoneNumber?: string;
}

export interface ZelleInfo {
  email: string;
  phoneNumber?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentReference?: string;
  message: string;
  error?: string;
  paymentInstructions?: PaymentInstructions;
}

export interface PaymentInstructions {
  method: PaymentMethod;
  amount: number;
  reference: string;
  recipientInfo: string;
  instructions: string[];
  contactEmail: string;
}

export interface ManualPaymentData {
  planId: string;
  isAnnual: boolean;
  amount: number;
  customerEmail: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  paypal?: PayPalInfo;
  venmo?: VenmoInfo;
  cashapp?: CashAppInfo;
  zelle?: ZelleInfo;
}

class ManualPaymentService {
  private isProcessing = false;
  
  // Your payment details - UPDATE THESE WITH YOUR ACTUAL INFO
  private readonly PAYMENT_DETAILS = {
    paypal: {
      email: 'your-paypal@email.com', // Replace with your PayPal email
      instructions: [
        'Send payment to the PayPal email above',
        'Include the payment reference in the note/memo',
        'Select "Friends and Family" to avoid fees (if applicable)',
        'Keep the receipt for your records'
      ]
    },
    venmo: {
      username: '@your-venmo-username', // Replace with your Venmo username
      instructions: [
        'Send payment to the Venmo username above',
        'Include the payment reference in the note',
        'Keep the receipt for your records'
      ]
    },
    cashapp: {
      cashtag: '$your-cashtag', // Replace with your Cash App cashtag
      instructions: [
        'Send payment to the Cash App cashtag above',
        'Include the payment reference in the note',
        'Keep the receipt for your records'
      ]
    },
    zelle: {
      email: 'your-zelle@email.com', // Replace with your Zelle email
      phone: '+1234567890', // Replace with your Zelle phone
      instructions: [
        'Send payment via Zelle to the email or phone above',
        'Include the payment reference in the memo',
        'Keep the receipt for your records'
      ]
    }
  };

  async processPayment(paymentData: ManualPaymentData): Promise<PaymentResult> {
    // Implementation details...
    // Generate payment reference, validate info, send notifications
  }

  // Additional methods for validation, notification, etc.
}

export const manualPaymentService = new ManualPaymentService();
```

#### 2. Payment Forms

Create individual form components for each payment method:

- `src/components/ui/PayPalForm.tsx`
- `src/components/ui/VenmoForm.tsx`
- `src/components/ui/CashAppForm.tsx`
- `src/components/ui/ZelleForm.tsx`
- `src/components/ui/PaymentMethodSelector.tsx`

#### 3. Payment Page

Create `src/pages/PaymentPage.tsx` to handle the payment flow:

```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield, CheckCircle, Sparkles } from 'lucide-react';
import PayPalForm from '../components/ui/PayPalForm';
import VenmoForm from '../components/ui/VenmoForm';
import CashAppForm from '../components/ui/CashAppForm';
import ZelleForm from '../components/ui/ZelleForm';
import PaymentMethodSelector from '../components/ui/PaymentMethodSelector';
import { manualPaymentService, ManualPaymentData } from '../services/manualPaymentService';
import { subscriptionService, SubscriptionTier } from '../services/subscriptionService';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';

const PaymentPage: React.FC = () => {
  // Implementation for payment processing UI
  // Handle payment method selection, form submission, success/error states
};
```

#### 4. Supabase Edge Function

Create `supabase/functions/payment-notification/index.ts`:

```typescript
import { serve } from "std/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "your-email@example.com";

serve(async (req) => {
  try {
    const { 
      customerName, 
      customerEmail, 
      planName, 
      amount, 
      isAnnual, 
      paymentMethod, 
      paymentReference 
    } = await req.json();

    // Send email notification to admin
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ApplyTrak <noreply@applytrak.com>",
        to: [ADMIN_EMAIL],
        subject: `💰 New Payment Request: ${planName} - ${customerName}`,
        html: renderPaymentNotificationHTML({
          customerName,
          customerEmail,
          planName,
          amount,
          isAnnual,
          paymentMethod,
          paymentReference,
          timestamp: new Date().toISOString()
        }),
      }),
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Payment notification sent successfully",
        emailId: emailResult.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

## Stripe Integration

For automated payment processing, integrate Stripe for credit card and subscription management.

### Setup

1. **Install Stripe dependencies:**

```bash
npm install @stripe/stripe-js stripe
```

2. **Environment Variables:**

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. **Stripe Service (`src/services/stripeService.ts`):**

```typescript
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { StripeElements, StripePaymentElement } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export interface StripePaymentData {
  amount: number;
  currency: string;
  customerEmail: string;
  planId: string;
  isAnnual: boolean;
}

class StripeService {
  private stripe: Promise<Stripe | null>;

  constructor() {
    this.stripe = stripePromise;
  }

  async createPaymentIntent(paymentData: StripePaymentData) {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    return response.json();
  }

  async confirmPayment(paymentIntentId: string, elements: StripeElements) {
    const stripe = await this.stripe;
    if (!stripe) throw new Error('Stripe not loaded');

    return stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });
  }

  async createSubscription(customerId: string, priceId: string) {
    const response = await fetch('/api/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        priceId,
      }),
    });

    return response.json();
  }
}

export const stripeService = new StripeService();
```

### Backend API Routes

Create API routes for Stripe integration:

#### 1. Create Payment Intent (`/api/create-payment-intent`)

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency, customerEmail, planId, isAnnual } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency || 'usd',
      metadata: {
        planId,
        isAnnual: isAnnual.toString(),
        customerEmail,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

#### 2. Create Subscription (`/api/create-subscription`)

```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId, priceId } = req.body;

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    res.status(200).json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Credit Card Processing

### Stripe Elements Integration

Create a credit card form using Stripe Elements:

#### Credit Card Form (`src/components/ui/StripeCreditCardForm.tsx`)

```typescript
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StripeCreditCardFormProps {
  amount: number;
  customerEmail: string;
  planId: string;
  isAnnual: boolean;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<StripeCreditCardFormProps> = ({
  amount,
  customerEmail,
  planId,
  isAnnual,
  onSuccess,
  onError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (error) {
        setError(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Credit Card Information
          </h3>
        </div>

        <PaymentElement 
          options={{
            layout: 'tabs'
          }}
        />

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <Lock className="h-5 w-5" />
              Pay ${amount.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const StripeCreditCardForm: React.FC<StripeCreditCardFormProps> = (props) => {
  const [clientSecret, setClientSecret] = useState<string>('');

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: props.amount,
            customerEmail: props.customerEmail,
            planId: props.planId,
            isAnnual: props.isAnnual,
          }),
        });

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
      } catch (error) {
        props.onError('Failed to initialize payment');
      }
    };

    createPaymentIntent();
  }, [props.amount, props.customerEmail, props.planId, props.isAnnual]);

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#3b82f6',
          },
        },
      }}
    >
      <PaymentForm {...props} />
    </Elements>
  );
};

export default StripeCreditCardForm;
```

## Subscription Management

### Subscription Service (`src/services/subscriptionService.ts`)

```typescript
export type SubscriptionTier = 'free' | 'pro';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  interval: 'month' | 'year';
  description: string;
  features: string[];
  limits: {
    applications: number | 'unlimited';
    analytics: boolean;
    cloudSync: boolean;
    emailReminders: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    teamCollaboration: boolean;
    customBranding: boolean;
    apiAccess: boolean;
  };
  popular?: boolean;
  recommended?: boolean;
}

export interface UserSubscription {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Perfect for getting started with job tracking',
    features: [
      'Track up to 50 applications',
      'Basic analytics only',
      'Local storage only',
      'Mobile responsive design'
    ],
    limits: {
      applications: 50,
      analytics: true,
      cloudSync: false,
      emailReminders: false,
      advancedAnalytics: false,
      prioritySupport: false,
      teamCollaboration: false,
      customBranding: false,
      apiAccess: false
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    interval: 'month',
    description: 'For serious job seekers who want the full experience',
    features: [
      'Unlimited applications',
      'Cloud sync & backup',
      'Email reminders & milestones',
      'Advanced analytics',
      'Company success rates',
      'Salary trend analysis',
      'Priority support',
    ],
    limits: {
      applications: 'unlimited',
      analytics: true,
      cloudSync: true,
      emailReminders: true,
      advancedAnalytics: true,
      prioritySupport: true,
      teamCollaboration: false,
      customBranding: false,
      apiAccess: false
    },
    popular: true,
    recommended: true
  }
];

class SubscriptionService {
  private currentSubscription: UserSubscription | null = null;

  getPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  }

  getPlan(id: SubscriptionTier): SubscriptionPlan | null {
    return SUBSCRIPTION_PLANS.find(plan => plan.id === id) || null;
  }

  async getCurrentSubscription(): Promise<UserSubscription | null> {
    // Fetch from your backend/Stripe
    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const subscription = await response.json();
        this.currentSubscription = subscription;
        return subscription;
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }

    // Fallback to free tier
    return {
      tier: 'free',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false
    };
  }

  hasFeature(feature: keyof SubscriptionPlan['limits']): boolean {
    const subscription = this.currentSubscription;
    if (!subscription) return false;

    const plan = this.getPlan(subscription.tier);
    if (!plan) return false;

    return plan.limits[feature] === true || plan.limits[feature] === 'unlimited';
  }

  canPerformAction(action: 'addApplication' | 'accessAdvancedAnalytics', currentCount?: number): {
    allowed: boolean;
    reason?: string;
    upgradeRequired?: boolean;
  } {
    const subscription = this.currentSubscription;
    if (!subscription) {
      return { allowed: false, reason: 'No subscription found', upgradeRequired: true };
    }

    const plan = this.getPlan(subscription.tier);
    if (!plan) {
      return { allowed: false, reason: 'Invalid subscription plan', upgradeRequired: true };
    }

    switch (action) {
      case 'addApplication':
        if (plan.limits.applications === 'unlimited') {
          return { allowed: true };
        }
        if (typeof plan.limits.applications === 'number') {
          if (!currentCount) return { allowed: true };
          if (currentCount >= plan.limits.applications) {
            return {
              allowed: false,
              reason: `You've reached your limit of ${plan.limits.applications} applications. Upgrade to Pro for unlimited applications.`,
              upgradeRequired: true
            };
          }
          return { allowed: true };
        }
        return { allowed: false, upgradeRequired: true };

      case 'accessAdvancedAnalytics':
        if (plan.limits.advancedAnalytics) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: 'Company success rates and salary analysis require a Pro subscription.',
          upgradeRequired: true
        };

      default:
        return { allowed: false, reason: 'Unknown action' };
    }
  }

  async upgradeSubscription(planId: SubscriptionTier, paymentMethod: 'stripe' | 'manual' = 'stripe'): Promise<{ success: boolean; message: string }> {
    try {
      if (paymentMethod === 'stripe') {
        // Handle Stripe subscription creation
        const response = await fetch('/api/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId,
            paymentMethod: 'stripe'
          }),
        });

        const result = await response.json();
        if (result.success) {
          this.currentSubscription = result.subscription;
          return {
            success: true,
            message: `Successfully upgraded to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan!`
          };
        } else {
          return {
            success: false,
            message: result.error || 'Failed to upgrade subscription'
          };
        }
      } else {
        // Handle manual payment flow
        return {
          success: true,
          message: 'Payment instructions generated. Your subscription will be activated after payment verification.'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to upgrade subscription. Please try again.'
      };
    }
  }

  getAnnualSavings(monthlyPrice: number): { annualPrice: number; savings: number; percentageSaved: number } {
    const annualPrice = monthlyPrice * 10; // 2 months free
    const monthlyTotal = monthlyPrice * 12;
    const savings = monthlyTotal - annualPrice;
    const percentageSaved = (savings / monthlyTotal) * 100;

    return {
      annualPrice,
      savings,
      percentageSaved: Math.round(percentageSaved)
    };
  }
}

export const subscriptionService = new SubscriptionService();
```

## Database Schema

### Supabase Tables

Create these tables in your Supabase database:

#### 1. Subscriptions Table

```sql
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('free', 'pro')),
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start timestamp with time zone DEFAULT now(),
  current_period_end timestamp with time zone DEFAULT now() + interval '1 month',
  cancel_at_period_end boolean DEFAULT false,
  trial_end timestamp with time zone,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
```

#### 2. Payments Table

```sql
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'usd',
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method text NOT NULL,
  payment_reference text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);
```

#### 3. Payment Methods Table

```sql
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('stripe', 'paypal', 'venmo', 'cashapp', 'zelle')),
  details jsonb NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own payment methods" ON public.payment_methods
  FOR ALL USING (auth.uid() = user_id);
```

## Frontend Components

### Upgrade Prompt Component

Create `src/components/ui/UpgradePrompt.tsx`:

```typescript
import React from 'react';
import { Crown, X, ArrowRight, Zap, Star } from 'lucide-react';
import { subscriptionService, SubscriptionTier } from '../../services/subscriptionService';
import { useAppStore } from '../../store/useAppStore';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
  recommendedPlan?: SubscriptionTier;
  title?: string;
  features?: string[];
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  isOpen,
  onClose,
  reason,
  recommendedPlan = 'pro',
  title,
  features
}) => {
  const { setSelectedTab } = useAppStore();
  
  const plan = subscriptionService.getPlan(recommendedPlan);
  const currentSubscription = subscriptionService.getCurrentSubscription();

  const defaultFeatures = [
    'Unlimited applications',
    'Cloud sync & backup',
    'Email reminders',
    'Advanced analytics',
    'Priority support'
  ];

  const featuresText = features || defaultFeatures;

  if (!isOpen || !plan) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="relative p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {title || 'Upgrade to Unlock More'}
            </h3>
            <p className="text-purple-100 text-sm">
              Get the most out of your job search
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Reason */}
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
              <p className="text-orange-800 dark:text-orange-200 text-sm">
                {reason}
              </p>
            </div>

            {/* Plan Highlight */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-6 border border-purple-200 dark:border-purple-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {plan.name} Plan
                  </h4>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    ${plan.price}/month
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                {featuresText.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Star className="h-3 w-3 text-purple-500 fill-current" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
                {featuresText.length > 4 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    +{featuresText.length - 4} more features
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSelectedTab('features');
                  onClose();
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                View Pricing & Upgrade
                <ArrowRight className="h-4 w-4" />
              </button>
              
              <button
                onClick={onClose}
                className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium py-2 transition-colors"
              >
                Maybe Later
              </button>
            </div>

            {/* Current Plan Info */}
            {currentSubscription && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Currently on {currentSubscription.tier.charAt(0).toUpperCase() + currentSubscription.tier.slice(1)} plan
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UpgradePrompt;
```

## Backend Services

### Stripe Webhook Handler

Create a webhook handler to process Stripe events:

```typescript
// pages/api/webhooks/stripe.ts
import Stripe from 'stripe';
import { NextApiRequest, NextApiResponse } from 'next';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  // Update subscription in database
  const { data, error } = await supabase
    .from('subscriptions')
    .upsert({
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      tier: subscription.metadata.planId || 'pro',
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to update subscription:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Mark subscription as canceled
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to cancel subscription:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Record successful payment
  const { error } = await supabase
    .from('payments')
    .insert({
      stripe_payment_intent_id: invoice.payment_intent as string,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency,
      status: 'completed',
      payment_method: 'stripe',
      metadata: {
        invoice_id: invoice.id,
        subscription_id: invoice.subscription,
      },
    });

  if (error) {
    console.error('Failed to record payment:', error);
    throw error;
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Record failed payment
  const { error } = await supabase
    .from('payments')
    .insert({
      stripe_payment_intent_id: invoice.payment_intent as string,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: 'failed',
      payment_method: 'stripe',
      metadata: {
        invoice_id: invoice.id,
        subscription_id: invoice.subscription,
        failure_reason: invoice.last_finalization_error?.message,
      },
    });

  if (error) {
    console.error('Failed to record failed payment:', error);
    throw error;
  }
}
```

## Security Considerations

### 1. Environment Variables

Never expose sensitive keys in client-side code:

```env
# Client-side (VITE_ prefix)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...

# Server-side only
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 2. Input Validation

Always validate payment data on the server:

```typescript
import { z } from 'zod';

const paymentSchema = z.object({
  amount: z.number().positive().max(10000), // Max $100
  currency: z.string().length(3),
  customerEmail: z.string().email(),
  planId: z.enum(['free', 'pro']),
  isAnnual: z.boolean(),
});

export function validatePaymentData(data: unknown) {
  return paymentSchema.parse(data);
}
```

### 3. Rate Limiting

Implement rate limiting for payment endpoints:

```typescript
import rateLimit from 'express-rate-limit';

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 payment attempts per windowMs
  message: 'Too many payment attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 4. PCI Compliance

- Never store credit card data
- Use Stripe Elements for secure card input
- Implement proper webhook signature verification
- Use HTTPS for all payment-related endpoints

## Testing

### 1. Unit Tests

```typescript
// __tests__/services/subscriptionService.test.ts
import { subscriptionService } from '../../src/services/subscriptionService';

describe('SubscriptionService', () => {
  test('should return correct plans', () => {
    const plans = subscriptionService.getPlans();
    expect(plans).toHaveLength(2);
    expect(plans[0].id).toBe('free');
    expect(plans[1].id).toBe('pro');
  });

  test('should check feature access correctly', () => {
    const mockSubscription = {
      tier: 'free' as const,
      status: 'active' as const,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
    };

    subscriptionService.currentSubscription = mockSubscription;
    
    expect(subscriptionService.hasFeature('cloudSync')).toBe(false);
    expect(subscriptionService.hasFeature('analytics')).toBe(true);
  });
});
```

### 2. Integration Tests

```typescript
// __tests__/api/payment.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/create-payment-intent';

describe('/api/create-payment-intent', () => {
  test('should create payment intent successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        amount: 9.99,
        currency: 'usd',
        customerEmail: 'test@example.com',
        planId: 'pro',
        isAnnual: false,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.clientSecret).toBeDefined();
  });
});
```

### 3. E2E Tests

```typescript
// cypress/integration/payment.spec.ts
describe('Payment Flow', () => {
  it('should complete payment successfully', () => {
    cy.visit('/payment?plan=pro&billing=monthly');
    
    // Select payment method
    cy.get('[data-testid="payment-method-stripe"]').click();
    
    // Fill in test card details
    cy.get('[data-testid="card-number"]').type('4242424242424242');
    cy.get('[data-testid="card-expiry"]').type('12/25');
    cy.get('[data-testid="card-cvc"]').type('123');
    
    // Submit payment
    cy.get('[data-testid="submit-payment"]').click();
    
    // Verify success
    cy.url().should('include', '/payment-success');
    cy.get('[data-testid="success-message"]').should('be.visible');
  });
});
```

## Deployment

### 1. Environment Setup

```bash
# Install dependencies
npm install @stripe/stripe-js stripe @stripe/react-stripe-js

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your actual keys
```

### 2. Stripe Dashboard Configuration

1. Create a Stripe account
2. Get your publishable and secret keys
3. Set up webhook endpoints
4. Configure products and prices
5. Test with Stripe's test cards

### 3. Supabase Configuration

1. Create Supabase project
2. Run database migrations
3. Set up RLS policies
4. Configure environment variables
5. Deploy Edge Functions

### 4. Production Checklist

- [ ] All environment variables configured
- [ ] Stripe webhooks set up and tested
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] Error monitoring set up
- [ ] Payment testing completed
- [ ] Backup procedures in place

## Conclusion

This guide provides a comprehensive foundation for implementing payment and subscription functionality in ApplyTrak. The system supports both manual payments for small businesses and automated Stripe integration for scalable operations.

Key benefits of this implementation:

- **Flexible Payment Options**: Support for multiple payment methods
- **Secure Processing**: PCI-compliant credit card handling
- **Scalable Architecture**: Easy to add new payment methods
- **User-Friendly**: Intuitive payment flow and upgrade prompts
- **Robust Error Handling**: Comprehensive error states and recovery
- **Testing Coverage**: Unit, integration, and E2E tests included

Remember to:

1. Test thoroughly in Stripe's test mode before going live
2. Implement proper monitoring and alerting
3. Keep security best practices in mind
4. Regularly update dependencies
5. Monitor payment success rates and optimize accordingly

For additional support or questions, refer to the Stripe documentation and Supabase guides.
