# Payment Form Configuration

## Environment Variables

### REACT_APP_ENABLE_TEST_CARDS

Controls whether test cards are allowed in the payment form.

**Values:**
- `true` - Enable test card support (development/testing only)
- `false` - Disable test card support (production)
- `undefined` - Defaults to `false` (production mode)

**Example:**
```bash
# Development environment
REACT_APP_ENABLE_TEST_CARDS=true

# Production environment
REACT_APP_ENABLE_TEST_CARDS=false
```

## Component Props

### isTestMode

Override the environment variable setting for test mode.

**Type:** `boolean | null`
**Default:** `null`

**Behavior:**
- `true` - Force test mode (allows test cards)
- `false` - Force production mode (rejects test cards)
- `null` - Use environment variable setting

**Example:**
```jsx
// Force test mode regardless of environment
<EnhancedPaymentForm isTestMode={true} onSubmit={handleSubmit} />

// Force production mode regardless of environment
<EnhancedPaymentForm isTestMode={false} onSubmit={handleSubmit} />

// Use environment variable setting
<EnhancedPaymentForm onSubmit={handleSubmit} />
```

## Test Card Numbers

The following test card numbers are recognized when test mode is enabled:

| Card Type | Number | Description |
|-----------|--------|-------------|
| Stripe | `4000000000000002` | Stripe test card |
| Visa | `4242424242424242` | Visa test card |
| Mastercard | `5555555555554444` | Mastercard test card |
| American Express | `378282246310005` | Amex test card |
| Discover | `6011111111111117` | Discover test card |

## Configuration Priority

1. **Component prop** (`isTestMode`) - Highest priority
2. **Environment variable** (`REACT_APP_ENABLE_TEST_CARDS`) - Fallback
3. **Default behavior** - Production mode (reject test cards)

## Security Considerations

- Test cards should **NEVER** be allowed in production
- Always set `REACT_APP_ENABLE_TEST_CARDS=false` in production builds
- Use the `isTestMode={false}` prop to explicitly disable test mode
- Monitor for test card usage in production logs

## Build Configuration

### Development Build
```bash
# .env.development
REACT_APP_ENABLE_TEST_CARDS=true
```

### Production Build
```bash
# .env.production
REACT_APP_ENABLE_TEST_CARDS=false
```

### CI/CD Pipeline
```yaml
# Example GitHub Actions
env:
  REACT_APP_ENABLE_TEST_CARDS: false
```

## Validation Rules

### Test Mode Enabled
- Test cards are marked as medium risk
- Test cards are allowed to proceed
- Form remains functional for testing

### Test Mode Disabled (Production)
- Test cards are marked as high risk
- Test cards are rejected with error message
- Form shows production security warnings

## Troubleshooting

### Test Cards Not Working
1. Check environment variable: `echo $REACT_APP_ENABLE_TEST_CARDS`
2. Verify component prop: `isTestMode={true}`
3. Check browser console for validation errors

### Production Build Issues
1. Ensure `REACT_APP_ENABLE_TEST_CARDS=false`
2. Verify no `isTestMode={true}` props in production code
3. Check build logs for environment variable values
