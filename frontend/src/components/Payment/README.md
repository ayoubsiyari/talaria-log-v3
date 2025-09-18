# Enhanced Payment Form Component

## Overview

The `EnhancedPaymentForm` component is a deprecated payment form that has been updated to use proper card validation and configuration-based test card handling. This component is no longer recommended for production use due to PCI DSS compliance concerns.

## ⚠️ Deprecation Notice

This component is **DEPRECATED** and should not be used in production. It sends raw card data which violates PCI DSS requirements. Use the PCI-compliant Stripe payment form instead.

## Features

- **Proper Card Validation**: Uses the `card-validator` library for accurate card number validation
- **Test Mode Configuration**: Supports both environment variables and props for test card handling
- **Security Risk Assessment**: Real-time validation with risk level indicators
- **PCI Compliance Warnings**: Clear warnings about security implications

## Configuration

### Environment Variables

Set the following environment variable to enable test card support:

```bash
# Enable test cards (development/testing only)
REACT_APP_ENABLE_TEST_CARDS=true

# Disable test cards (production)
REACT_APP_ENABLE_TEST_CARDS=false
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSubmit` | `function` | - | Callback function called when form is submitted |
| `loading` | `boolean` | `false` | Whether the form is in a loading state |
| `isTestMode` | `boolean` | `null` | Override test mode setting (takes precedence over env var) |

### Test Mode Behavior

- **When `isTestMode={true}` or `REACT_APP_ENABLE_TEST_CARDS=true`**:
  - Test cards are allowed and marked as medium risk
  - Form remains functional for testing purposes
  - Test card numbers are recognized and handled appropriately

- **When `isTestMode={false}` or `REACT_APP_ENABLE_TEST_CARDS=false`**:
  - Test cards are rejected with high risk level
  - Form shows production mode warnings
  - Test card numbers are blocked

## Supported Test Cards

The following test card numbers are recognized when test mode is enabled:

- `4000000000000002` - Stripe test card
- `4242424242424242` - Visa test card
- `5555555555554444` - Mastercard test card
- `378282246310005` - American Express test card
- `6011111111111117` - Discover test card

## Usage Examples

### Basic Usage (Production)

```jsx
import EnhancedPaymentForm from '@/components/Payment/EnhancedPaymentForm';

function PaymentPage() {
  const handleSubmit = (paymentData) => {
    console.log('Payment data:', paymentData);
  };

  return (
    <EnhancedPaymentForm 
      onSubmit={handleSubmit}
      loading={false}
    />
  );
}
```

### Test Mode Usage

```jsx
import EnhancedPaymentForm from '@/components/Payment/EnhancedPaymentForm';

function TestPaymentPage() {
  const handleSubmit = (paymentData) => {
    console.log('Test payment data:', paymentData);
  };

  return (
    <EnhancedPaymentForm 
      onSubmit={handleSubmit}
      isTestMode={true}
      loading={false}
    />
  );
}
```

### Environment-Based Configuration

```jsx
// .env.development
REACT_APP_ENABLE_TEST_CARDS=true

// .env.production
REACT_APP_ENABLE_TEST_CARDS=false
```

## Security Considerations

1. **PCI DSS Compliance**: This component is NOT PCI compliant and should not be used in production
2. **Test Card Handling**: Test cards are only allowed when explicitly configured
3. **Card Validation**: Uses industry-standard `card-validator` library for validation
4. **Risk Assessment**: Provides real-time security risk assessment

## Migration to Stripe

To migrate to a PCI-compliant solution:

1. Use the Stripe payment form instead
2. Implement server-side payment processing
3. Never store raw card data
4. Use Stripe's secure tokenization

## Testing

Run the test suite:

```bash
npm test EnhancedPaymentForm
```

The tests cover:
- Test mode configuration
- Card validation behavior
- Environment variable handling
- Test card recognition
- Production mode restrictions

## Dependencies

- `card-validator`: For proper card number validation
- `react`: React framework
- `lucide-react`: Icons
- UI components from the design system

## Changelog

### v2.0.0
- ✅ Removed hard-coded test card comparison
- ✅ Added environment variable configuration (`REACT_APP_ENABLE_TEST_CARDS`)
- ✅ Added `isTestMode` prop for explicit test mode control
- ✅ Replaced regex validation with `card-validator` library
- ✅ Added comprehensive test coverage
- ✅ Updated documentation

### v1.0.0
- Initial implementation with hard-coded test card handling
