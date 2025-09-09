/**
 * Stripe Service
 * Handles Stripe payment processing
 */

import { loadStripe } from '@stripe/stripe-js';

class StripeService {
  constructor() {
    this.stripe = null;
    this.stripePromise = null;
    this.publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key';
  }

  /**
   * Initialize Stripe
   */
  async initialize() {
    if (!this.stripePromise) {
      this.stripePromise = loadStripe(this.publishableKey);
    }
    
    if (!this.stripe) {
      this.stripe = await this.stripePromise;
    }
    
    return this.stripe;
  }

  /**
   * Create payment method from card details
   */
  async createPaymentMethod(cardDetails) {
    try {
      const stripe = await this.initialize();
      
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: {
          number: cardDetails.cardNumber.replace(/\s/g, ''),
          exp_month: parseInt(cardDetails.expiryDate.split('/')[0]),
          exp_year: parseInt('20' + cardDetails.expiryDate.split('/')[1]),
          cvc: cardDetails.cvv,
        },
        billing_details: {
          name: cardDetails.cardName,
          email: cardDetails.customerEmail,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return paymentMethod;
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw error;
    }
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
    try {
      const stripe = await this.initialize();
      
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      return paymentIntent;
    } catch (error) {
      console.error('Error confirming payment intent:', error);
      throw error;
    }
  }

  /**
   * Process payment with Stripe
   */
  async processPayment(paymentData) {
    try {
      const { cardDetails, paymentIntentId, customerEmail } = paymentData;

      // Create payment method
      const paymentMethod = await this.createPaymentMethod({
        ...cardDetails,
        customerEmail
      });

      // Confirm payment intent
      const paymentIntent = await this.confirmPaymentIntent(
        paymentIntentId,
        paymentMethod.id
      );

      return {
        success: true,
        paymentIntent,
        paymentMethod
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate card number using Luhn algorithm
   */
  validateCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');
    const digits = cleaned.split('').map(Number);
    
    if (digits.length < 13 || digits.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i];

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Format card number with spaces
   */
  formatCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(' ');
  }

  /**
   * Validate expiry date
   */
  validateExpiryDate(expiryDate) {
    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    const expMonth = parseInt(month);
    const expYear = parseInt(year);

    if (expMonth < 1 || expMonth > 12) {
      return false;
    }

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return false;
    }

    return true;
  }

  /**
   * Validate CVV
   */
  validateCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
  }

  /**
   * Get card type from number
   */
  getCardType(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6/.test(cleaned)) return 'discover';
    
    return 'unknown';
  }
}

// Create and export singleton instance
const stripeService = new StripeService();
export default stripeService;
