// src/components/seo/PageSEO.tsx - Page-specific SEO configurations
import React from 'react';
import SEOHead from './SEOHead';

interface PageSEOProps {
  page: 'home' | 'applications' | 'goals' | 'analytics' | 'profile' | 'features' | 'marketing' | 'admin';
  additionalProps?: Partial<React.ComponentProps<typeof SEOHead>>;
}

const PageSEO: React.FC<PageSEOProps> = ({ page, additionalProps = {} }) => {
  const seoConfigs = {
    home: {
      title: 'ApplyTrak - Track Your Job Search Journey',
      description: 'Welcome to ApplyTrak! Track your job applications with analytics, set goals, and organize your career journey. Start your job search tracking today.',
      keywords: ['job tracker', 'job application tracker', 'career management', 'job search', 'analytics', 'goals'],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "ApplyTrak Home",
        "description": "Track your job search journey with ApplyTrak",
        "url": "https://applytrak.com",
        "mainEntity": {
          "@type": "SoftwareApplication",
          "name": "ApplyTrak",
          "applicationCategory": "BusinessApplication"
        }
      }
    },
    
    applications: {
      title: 'Job Applications - ApplyTrak',
      description: 'Track and manage your job applications with ApplyTrak. View application status, company details, and progress analytics all in one place.',
      keywords: ['job applications', 'application tracking', 'job status', 'career management', 'job search'],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Job Applications - ApplyTrak",
        "description": "Track and manage your job applications",
        "url": "https://applytrak.com/applications"
      }
    },
    
    goals: {
      title: 'Career Goals - ApplyTrak',
      description: 'Set and track your career goals with ApplyTrak. Create milestones, monitor progress, and achieve your professional objectives.',
      keywords: ['career goals', 'goal setting', 'career planning', 'professional development', 'milestones'],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Career Goals - ApplyTrak",
        "description": "Set and track your career goals",
        "url": "https://applytrak.com/goals"
      }
    },
    
    analytics: {
      title: 'Analytics Dashboard - ApplyTrak',
      description: 'View detailed analytics of your job search progress with ApplyTrak. Track application success rates, response times, and career insights.',
      keywords: ['job search analytics', 'career analytics', 'application statistics', 'job search insights', 'data visualization'],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Analytics Dashboard - ApplyTrak",
        "description": "View detailed analytics of your job search progress",
        "url": "https://applytrak.com/analytics"
      }
    },
    
    profile: {
      title: 'Profile Settings - ApplyTrak',
      description: 'Manage your ApplyTrak profile settings, privacy preferences, and account information. Customize your job tracking experience.',
      keywords: ['profile settings', 'account management', 'privacy settings', 'user preferences', 'account customization'],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Profile Settings - ApplyTrak",
        "description": "Manage your ApplyTrak profile and settings",
        "url": "https://applytrak.com/profile"
      }
    },
    
    features: {
      title: 'Features & Pricing - ApplyTrak',
      description: 'Discover ApplyTrak features and pricing plans. Compare free and premium features for job application tracking and career management.',
      keywords: ['features', 'pricing', 'premium features', 'job tracker features', 'career management tools'],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Features & Pricing - ApplyTrak",
        "description": "Discover ApplyTrak features and pricing",
        "url": "https://applytrak.com/features"
      }
    },
    
    marketing: {
      title: 'ApplyTrak - Track Your Job Search Journey',
      description: 'Transform your job search with ApplyTrak. Track applications, set goals, analyze progress, and land your dream job faster. Start free today!',
      keywords: ['job search', 'job tracker', 'career management', 'application tracking', 'job search tool', 'career planning'],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "ApplyTrak - Job Search Tracker",
        "description": "Transform your job search with ApplyTrak",
        "url": "https://applytrak.com/marketing"
      }
    },
    
    admin: {
      title: 'Admin Dashboard - ApplyTrak',
      description: 'ApplyTrak admin dashboard for system management and analytics.',
      keywords: ['admin', 'dashboard', 'system management'],
      noIndex: true,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Admin Dashboard - ApplyTrak",
        "description": "ApplyTrak admin dashboard",
        "url": "https://applytrak.com/admin"
      }
    }
  };

  const config = seoConfigs[page];
  
  return <SEOHead {...config} {...additionalProps} />;
};

export default PageSEO;
