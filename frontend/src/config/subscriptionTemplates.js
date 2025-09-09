// Subscription Plan Templates Configuration
// This file contains all the template configurations for subscription plans
// You can easily customize colors, layouts, and styling here

export const subscriptionTemplates = {
  modern: {
    name: 'Modern Card',
    description: 'Clean, modern design with gradient backgrounds',
    layout: 'card',
    color_schemes: {
      blue: {
        primary: 'from-blue-500 to-blue-600',
        secondary: 'from-blue-50 to-blue-100',
        accent: 'blue-500',
        text: 'text-blue-900',
        border: 'border-blue-200'
      },
      purple: {
        primary: 'from-purple-500 to-purple-600',
        secondary: 'from-purple-50 to-purple-100',
        accent: 'purple-500',
        text: 'text-purple-900',
        border: 'border-purple-200'
      },
      green: {
        primary: 'from-green-500 to-green-600',
        secondary: 'from-green-50 to-green-100',
        accent: 'green-500',
        text: 'text-green-900',
        border: 'border-green-200'
      },
      orange: {
        primary: 'from-orange-500 to-orange-600',
        secondary: 'from-orange-50 to-orange-100',
        accent: 'orange-500',
        text: 'text-orange-900',
        border: 'border-orange-200'
      }
    },
    features: ['gradient_bg', 'rounded_corners', 'shadow_effects', 'hover_animations'],
    default_settings: {
      show_badge: true,
      highlight_features: true,
      show_comparison: true,
      show_trial: true,
      cta_style: 'gradient',
      feature_icons: true
    }
  },
  classic: {
    name: 'Classic Professional',
    description: 'Traditional business-style layout',
    layout: 'table',
    color_schemes: {
      gray: {
        primary: 'bg-gray-800',
        secondary: 'bg-gray-50',
        accent: 'gray-600',
        text: 'text-gray-900',
        border: 'border-gray-300'
      },
      blue: {
        primary: 'bg-blue-800',
        secondary: 'bg-blue-50',
        accent: 'blue-600',
        text: 'text-blue-900',
        border: 'border-blue-300'
      },
      green: {
        primary: 'bg-green-800',
        secondary: 'bg-green-50',
        accent: 'green-600',
        text: 'text-green-900',
        border: 'border-green-300'
      }
    },
    features: ['clean_lines', 'professional_typography', 'subtle_borders'],
    default_settings: {
      show_badge: false,
      highlight_features: false,
      show_comparison: true,
      show_trial: true,
      cta_style: 'solid',
      feature_icons: false
    }
  },
  minimal: {
    name: 'Minimalist',
    description: 'Simple, clean design focusing on content',
    layout: 'minimal',
    color_schemes: {
      white: {
        primary: 'bg-white',
        secondary: 'bg-gray-50',
        accent: 'gray-600',
        text: 'text-gray-900',
        border: 'border-gray-200'
      },
      gray: {
        primary: 'bg-gray-100',
        secondary: 'bg-white',
        accent: 'gray-700',
        text: 'text-gray-800',
        border: 'border-gray-300'
      },
      black: {
        primary: 'bg-black',
        secondary: 'bg-gray-900',
        accent: 'white',
        text: 'text-white',
        border: 'border-gray-700'
      }
    },
    features: ['minimal_typography', 'lots_of_whitespace', 'subtle_colors'],
    default_settings: {
      show_badge: false,
      highlight_features: false,
      show_comparison: false,
      show_trial: true,
      cta_style: 'outline',
      feature_icons: false
    }
  },
  premium: {
    name: 'Premium Luxury',
    description: 'High-end design with premium styling',
    layout: 'premium',
    color_schemes: {
      gold: {
        primary: 'from-yellow-400 to-yellow-600',
        secondary: 'from-yellow-50 to-orange-50',
        accent: 'yellow-500',
        text: 'text-yellow-900',
        border: 'border-yellow-300'
      },
      purple: {
        primary: 'from-purple-600 to-purple-800',
        secondary: 'from-purple-50 to-indigo-50',
        accent: 'purple-600',
        text: 'text-purple-900',
        border: 'border-purple-300'
      },
      dark: {
        primary: 'from-gray-800 to-gray-900',
        secondary: 'from-gray-900 to-black',
        accent: 'gold-500',
        text: 'text-white',
        border: 'border-gray-600'
      }
    },
    features: ['gold_accents', 'premium_typography', 'luxury_effects'],
    default_settings: {
      show_badge: true,
      highlight_features: true,
      show_comparison: true,
      show_trial: true,
      cta_style: 'premium',
      feature_icons: true
    }
  }
};

// Template CSS Classes
export const templateStyles = {
  modern: {
    container: 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300',
    header: 'text-center p-8',
    title: 'text-3xl font-bold text-gray-900 mb-2',
    price: 'text-4xl font-bold text-blue-600 mb-4',
    description: 'text-gray-600 mb-6',
    features: 'space-y-3 mb-8 text-left max-w-md mx-auto',
    feature: 'flex items-center text-gray-700',
    featureIcon: 'w-5 h-5 text-green-500 mr-3 flex-shrink-0',
    cta: 'w-full max-w-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200',
    badge: 'inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4'
  },
  classic: {
    container: 'bg-white border border-gray-300 rounded-lg shadow-sm',
    header: 'text-center p-6 border-b border-gray-200',
    title: 'text-2xl font-bold text-gray-900 mb-2',
    price: 'text-3xl font-bold text-blue-600 mb-4',
    description: 'text-gray-600 mb-4',
    features: 'p-6 space-y-2',
    feature: 'flex items-center text-gray-700',
    featureIcon: 'w-4 h-4 text-green-500 mr-2',
    cta: 'w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition-colors',
    badge: 'inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold mb-3'
  },
  minimal: {
    container: 'bg-white border border-gray-200 rounded-lg p-8',
    header: 'text-center mb-8',
    title: 'text-2xl font-light text-gray-900 mb-3',
    price: 'text-3xl font-light text-gray-800 mb-6',
    description: 'text-gray-600 mb-8',
    features: 'space-y-4 mb-8',
    feature: 'text-gray-700 text-center',
    featureIcon: 'hidden',
    cta: 'w-full border-2 border-gray-800 text-gray-800 font-light py-3 px-6 rounded hover:bg-gray-800 hover:text-white transition-all duration-200',
    badge: 'hidden'
  },
  premium: {
    container: 'bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-300 rounded-2xl shadow-2xl',
    header: 'text-center p-10',
    title: 'text-4xl font-bold text-yellow-900 mb-3',
    price: 'text-5xl font-bold text-yellow-600 mb-6',
    description: 'text-yellow-800 mb-8 text-lg',
    features: 'space-y-4 mb-10 text-left max-w-lg mx-auto',
    feature: 'flex items-center text-yellow-800 text-lg',
    featureIcon: 'w-6 h-6 text-yellow-600 mr-4 flex-shrink-0',
    cta: 'w-full max-w-sm bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-4 px-8 rounded-xl text-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg',
    badge: 'inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-full text-lg font-bold mb-6 shadow-lg'
  }
};

// Default template settings
export const defaultTemplateSettings = {
  layout: 'modern',
  color_scheme: 'blue',
  show_badge: true,
  highlight_features: true,
  show_comparison: true,
  show_trial: true,
  cta_style: 'gradient',
  feature_icons: true,
  badge_text: 'Most Popular',
  cta_text: 'Get Started',
  trial_text: 'Free Trial',
  currency: 'USD',
  currency_symbol: '$'
};

// Template customization options
export const customizationOptions = {
  layouts: [
    { value: 'card', label: 'Card Layout', description: 'Modern card-based design' },
    { value: 'table', label: 'Table Layout', description: 'Traditional table format' },
    { value: 'minimal', label: 'Minimal Layout', description: 'Clean, simple design' },
    { value: 'premium', label: 'Premium Layout', description: 'Luxury, high-end design' }
  ],
  colorSchemes: [
    { value: 'blue', label: 'Blue', description: 'Professional blue theme' },
    { value: 'purple', label: 'Purple', description: 'Creative purple theme' },
    { value: 'green', label: 'Green', description: 'Natural green theme' },
    { value: 'orange', label: 'Orange', description: 'Energetic orange theme' },
    { value: 'gray', label: 'Gray', description: 'Neutral gray theme' },
    { value: 'gold', label: 'Gold', description: 'Premium gold theme' }
  ],
  ctaStyles: [
    { value: 'gradient', label: 'Gradient', description: 'Modern gradient button' },
    { value: 'solid', label: 'Solid', description: 'Traditional solid button' },
    { value: 'outline', label: 'Outline', description: 'Minimal outline button' },
    { value: 'premium', label: 'Premium', description: 'Luxury premium button' }
  ]
};

// Export helper functions
export const getTemplateConfig = (templateName) => {
  return subscriptionTemplates[templateName] || subscriptionTemplates.modern;
};

export const getTemplateStyles = (templateName) => {
  return templateStyles[templateName] || templateStyles.modern;
};

export const getColorScheme = (templateName, colorScheme) => {
  const template = getTemplateConfig(templateName);
  return template.color_schemes[colorScheme] || template.color_schemes.blue;
};

export const applyTemplateStyles = (templateName, colorScheme, customStyles = {}) => {
  const baseStyles = getTemplateStyles(templateName);
  const colorConfig = getColorScheme(templateName, colorScheme);
  
  return {
    ...baseStyles,
    container: `${baseStyles.container} ${colorConfig.secondary}`,
    price: `${baseStyles.price} ${colorConfig.text}`,
    cta: `${baseStyles.cta} ${colorConfig.primary}`,
    ...customStyles
  };
};
