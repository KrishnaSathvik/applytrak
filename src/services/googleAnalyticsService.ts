// src/services/googleAnalyticsService.ts - Google Analytics 4 Integration
import ReactGA from 'react-ga4';

// Google Analytics Configuration
const GA_TRACKING_ID = process.env.REACT_APP_GA_TRACKING_ID || 'G-NGNH0RH9WZ';

// Initialize Google Analytics
export const initializeGA = () => {
  if (process.env.NODE_ENV === 'production' && GA_TRACKING_ID && GA_TRACKING_ID.startsWith('G-')) {
    ReactGA.initialize(GA_TRACKING_ID, {
      testMode: false,
      gtagOptions: {
        send_page_view: false, // We'll handle page views manually
        anonymize_ip: true, // Privacy-friendly
        allow_google_signals: false, // Disable Google Signals for privacy
        allow_ad_personalization_signals: false, // Disable ad personalization
      }
    });
    
    console.log('Google Analytics initialized with tracking ID:', GA_TRACKING_ID);
  } else {
    console.log('Google Analytics disabled in development mode');
  }
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (process.env.NODE_ENV === 'production' && GA_TRACKING_ID && GA_TRACKING_ID.startsWith('G-')) {
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title
    });
    
    console.log('GA4 Page View:', { path, title: title || document.title });
  }
};

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (process.env.NODE_ENV === 'production' && GA_TRACKING_ID && GA_TRACKING_ID.startsWith('G-')) {
    const eventData: any = {
      action,
      category
    };
    
    if (label) {
      eventData.label = label;
    }
    
    if (value !== undefined) {
      eventData.value = value;
    }
    
    ReactGA.event(eventData);
    
    console.log('GA4 Event:', { action, category, label, value });
  }
};

// Track user interactions
export const trackUserInteraction = {
  // Application tracking
  applicationCreated: (_applicationId: string, company: string) => {
    trackEvent('application_created', 'Application', `Company: ${company}`, 1);
  },
  
  applicationUpdated: (_applicationId: string, status: string) => {
    trackEvent('application_updated', 'Application', `Status: ${status}`, 1);
  },
  
  applicationDeleted: (_applicationId: string) => {
    trackEvent('application_deleted', 'Application', 'Delete', 1);
  },
  
  // Goal tracking
  goalCreated: (_goalId: string, goalType: string) => {
    trackEvent('goal_created', 'Goals', `Type: ${goalType}`, 1);
  },
  
  goalCompleted: (_goalId: string, goalType: string) => {
    trackEvent('goal_completed', 'Goals', `Type: ${goalType}`, 1);
  },
  
  // User engagement
  tabSwitched: (tabName: string) => {
    trackEvent('tab_switched', 'Navigation', `Tab: ${tabName}`, 1);
  },
  
  modalOpened: (modalName: string) => {
    trackEvent('modal_opened', 'UI', `Modal: ${modalName}`, 1);
  },
  
  dataExported: (exportType: string) => {
    trackEvent('data_exported', 'Data', `Type: ${exportType}`, 1);
  },
  
  dataImported: (importType: string) => {
    trackEvent('data_imported', 'Data', `Type: ${importType}`, 1);
  },
  
  // Authentication
  userSignedUp: (method: string) => {
    trackEvent('sign_up', 'Authentication', `Method: ${method}`, 1);
  },
  
  userSignedIn: (method: string) => {
    trackEvent('login', 'Authentication', `Method: ${method}`, 1);
  },
  
  userSignedOut: () => {
    trackEvent('logout', 'Authentication', 'Sign Out', 1);
  },
  
  // Feature usage
  analyticsViewed: () => {
    trackEvent('analytics_viewed', 'Features', 'Analytics Dashboard', 1);
  },
  
  goalsViewed: () => {
    trackEvent('goals_viewed', 'Features', 'Goals Tab', 1);
  },
  
  profileViewed: () => {
    trackEvent('profile_viewed', 'Features', 'Profile Tab', 1);
  },
  
  // Error tracking
  errorOccurred: (errorType: string, errorMessage: string) => {
    trackEvent('error_occurred', 'Error', `${errorType}: ${errorMessage}`, 1);
  },
  
  // Performance tracking
  slowLoad: (loadTime: number, page: string) => {
    trackEvent('slow_load', 'Performance', `Page: ${page}`, Math.round(loadTime));
  },
  
  // Search and filtering
  searchPerformed: (searchTerm: string, resultsCount: number) => {
    trackEvent('search_performed', 'Search', `Term: ${searchTerm}`, resultsCount);
  },
  
  filterApplied: (filterType: string, filterValue: string) => {
    trackEvent('filter_applied', 'Search', `${filterType}: ${filterValue}`, 1);
  }
};

// Track conversion events
export const trackConversion = {
  // Key user actions that indicate value
  firstApplicationAdded: () => {
    trackEvent('first_application_added', 'Conversion', 'Onboarding', 1);
  },
  
  firstGoalSet: () => {
    trackEvent('first_goal_set', 'Conversion', 'Onboarding', 1);
  },
  
  dataBackupEnabled: () => {
    trackEvent('data_backup_enabled', 'Conversion', 'Feature Adoption', 1);
  },
  
  premiumFeatureUsed: (featureName: string) => {
    trackEvent('premium_feature_used', 'Conversion', `Feature: ${featureName}`, 1);
  }
};

// Track user journey
export const trackUserJourney = {
  onboardingStarted: () => {
    trackEvent('onboarding_started', 'User Journey', 'Onboarding', 1);
  },
  
  onboardingCompleted: () => {
    trackEvent('onboarding_completed', 'User Journey', 'Onboarding', 1);
  },
  
  weeklyActiveUser: () => {
    trackEvent('weekly_active_user', 'User Journey', 'Engagement', 1);
  },
  
  monthlyActiveUser: () => {
    trackEvent('monthly_active_user', 'User Journey', 'Engagement', 1);
  }
};

// Enhanced ecommerce tracking (for future premium features)
export const trackEcommerce = {
  purchase: (transactionId: string, value: number, _currency: string = 'USD') => {
    if (process.env.NODE_ENV === 'production' && GA_TRACKING_ID && GA_TRACKING_ID.startsWith('G-')) {
      ReactGA.event({
        action: 'purchase',
        category: 'Ecommerce',
        label: `Transaction: ${transactionId}`,
        value: value
      });
    }
  },
  
  addToCart: (_itemId: string, itemName: string, value: number) => {
    trackEvent('add_to_cart', 'Ecommerce', `Item: ${itemName}`, value);
  },
  
  beginCheckout: (value: number) => {
    trackEvent('begin_checkout', 'Ecommerce', 'Checkout Started', value);
  }
};

// Privacy-compliant tracking
export const setConsent = (analytics: boolean, marketing: boolean = false) => {
  if (process.env.NODE_ENV === 'production' && GA_TRACKING_ID && GA_TRACKING_ID.startsWith('G-')) {
    // Set consent for Google Analytics
    ReactGA.gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: marketing ? 'granted' : 'denied',
      ad_user_data: marketing ? 'granted' : 'denied',
      ad_personalization: marketing ? 'granted' : 'denied'
    });
  }
};

// Get analytics data (for admin dashboard)
export const getAnalyticsData = async () => {
  // This would typically connect to Google Analytics Reporting API
  // For now, return mock data structure
  return {
    pageViews: 0,
    uniqueUsers: 0,
    bounceRate: 0,
    averageSessionDuration: 0,
    topPages: [],
    topEvents: [],
    userEngagement: {}
  };
};

export default {
  initializeGA,
  trackPageView,
  trackEvent,
  trackUserInteraction,
  trackConversion,
  trackUserJourney,
  trackEcommerce,
  setConsent,
  getAnalyticsData
};
