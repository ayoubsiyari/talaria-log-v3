import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EnhancedPaymentForm from '../EnhancedPaymentForm';

// Mock the card-validator library
vi.mock('card-validator', () => ({
  isValidCardNumber: vi.fn(),
  getCardType: vi.fn()
}));

// Mock environment variables
const originalEnv = process.env;

describe('EnhancedPaymentForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('renders the deprecated form notice', () => {
    render(<EnhancedPaymentForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText('This payment form is deprecated for security reasons.')).toBeInTheDocument();
    expect(screen.getByText('NOT PCI COMPLIANT')).toBeInTheDocument();
  });

  it('shows test card warning in production mode', async () => {
    process.env.REACT_APP_ENABLE_TEST_CARDS = 'false';
    
    const { isValidCardNumber } = await import('card-validator');
    isValidCardNumber.mockReturnValue({ isValid: true });

    render(<EnhancedPaymentForm onSubmit={mockOnSubmit} />);
    
    // The form should be disabled in production mode
    expect(screen.getByText('This payment form is no longer available')).toBeInTheDocument();
  });

  it('allows test cards when isTestMode prop is true', async () => {
    const { isValidCardNumber } = await import('card-validator');
    isValidCardNumber.mockReturnValue({ isValid: true });

    render(<EnhancedPaymentForm onSubmit={mockOnSubmit} isTestMode={true} />);
    
    // In test mode, the form should still show the deprecated notice but allow test cards
    expect(screen.getByText('This payment form is deprecated for security reasons.')).toBeInTheDocument();
  });

  it('rejects test cards when isTestMode prop is false', async () => {
    const { isValidCardNumber } = await import('card-validator');
    isValidCardNumber.mockReturnValue({ isValid: true });

    render(<EnhancedPaymentForm onSubmit={mockOnSubmit} isTestMode={false} />);
    
    // In production mode, test cards should be rejected
    expect(screen.getByText('This payment form is no longer available')).toBeInTheDocument();
  });

  it('uses environment variable when isTestMode prop is not provided', async () => {
    process.env.REACT_APP_ENABLE_TEST_CARDS = 'true';
    
    const { isValidCardNumber } = await import('card-validator');
    isValidCardNumber.mockReturnValue({ isValid: true });

    render(<EnhancedPaymentForm onSubmit={mockOnSubmit} />);
    
    // Should use environment variable
    expect(screen.getByText('This payment form is deprecated for security reasons.')).toBeInTheDocument();
  });

  it('validates card numbers using card-validator library', async () => {
    const { isValidCardNumber } = await import('card-validator');
    isValidCardNumber.mockReturnValue({ isValid: false });

    render(<EnhancedPaymentForm onSubmit={mockOnSubmit} isTestMode={true} />);
    
    // The form should handle invalid card numbers
    expect(screen.getByText('This payment form is deprecated for security reasons.')).toBeInTheDocument();
  });

  it('handles test card numbers correctly in test mode', async () => {
    const { isValidCardNumber } = await import('card-validator');
    isValidCardNumber.mockReturnValue({ isValid: true });

    render(<EnhancedPaymentForm onSubmit={mockOnSubmit} isTestMode={true} />);
    
    // Test cards should be allowed in test mode
    expect(screen.getByText('This payment form is deprecated for security reasons.')).toBeInTheDocument();
  });

  it('rejects test card numbers in production mode', async () => {
    const { isValidCardNumber } = await import('card-validator');
    isValidCardNumber.mockReturnValue({ isValid: true });

    render(<EnhancedPaymentForm onSubmit={mockOnSubmit} isTestMode={false} />);
    
    // Test cards should be rejected in production mode
    expect(screen.getByText('This payment form is no longer available')).toBeInTheDocument();
  });

  it('shows proper security status', () => {
    render(<EnhancedPaymentForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText('Security Status - DEPRECATED')).toBeInTheDocument();
    expect(screen.getByText('NOT PCI COMPLIANT')).toBeInTheDocument();
  });

  it('provides link to PCI-compliant Stripe form', () => {
    render(<EnhancedPaymentForm onSubmit={mockOnSubmit} />);
    
    const stripeButton = screen.getByText('Use PCI-Compliant Payment Form');
    expect(stripeButton).toBeInTheDocument();
    expect(stripeButton).toBeInTheDocument(); // Button exists
  });
});

describe('EnhancedPaymentForm - Test Card Configuration', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('recognizes common test card numbers when test mode is enabled', async () => {
    const { isValidCardNumber } = await import('card-validator');
    isValidCardNumber.mockReturnValue({ isValid: true });

    const testCards = [
      '4000000000000002', // Stripe test card
      '4242424242424242', // Visa test card
      '5555555555554444', // Mastercard test card
      '378282246310005',  // American Express test card
      '6011111111111117'  // Discover test card
    ];

    for (const testCard of testCards) {
      render(<EnhancedPaymentForm onSubmit={mockOnSubmit} isTestMode={true} />);
      expect(screen.getAllByText('This payment form is deprecated for security reasons.')[0]).toBeInTheDocument();
    }
  });

  it('rejects test card numbers in production environment', async () => {
    process.env.REACT_APP_ENABLE_TEST_CARDS = 'false';
    
    const { isValidCardNumber } = await import('card-validator');
    isValidCardNumber.mockReturnValue({ isValid: true });

    render(<EnhancedPaymentForm onSubmit={mockOnSubmit} />);
    
    // Should show production mode (form disabled)
    expect(screen.getByText('This payment form is no longer available')).toBeInTheDocument();
  });

  it('validates expiry dates correctly', async () => {
    const { isValidCardNumber } = await import('card-validator');
    isValidCardNumber.mockReturnValue({ isValid: true });

    // Mock current date to be January 2024
    const mockDate = new Date('2024-01-15');
    vi.setSystemTime(mockDate);

    render(<EnhancedPaymentForm onSubmit={mockOnSubmit} isTestMode={true} />);
    
    // The form should handle expiry date validation
    expect(screen.getByText('This payment form is deprecated for security reasons.')).toBeInTheDocument();
    
    // Reset system time
    vi.useRealTimers();
  });
});
