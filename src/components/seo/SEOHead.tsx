// src/components/seo/SEOHead.tsx - Comprehensive SEO Component
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: 'website' | 'article' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterCreator?: string;
  noIndex?: boolean;
  structuredData?: object;
  additionalMeta?: Array<{ name?: string; property?: string; content: string }>;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'ApplyTrak - Track Your Job Search Journey',
  description = 'Track your job search journey with ApplyTrak. Features include application tracking, analytics dashboard, goal setting, and smart organization. Built with React, TypeScript, and modern design.',
  keywords = [
    'job tracker',
    'job application tracker',
    'career management',
    'job search',
    'analytics',
    'goals',
    'react app',
    'applytrak',
    'employment tracking',
    'career planning'
  ],
  canonicalUrl = 'https://applytrak.com',
  ogImage = 'https://applytrak.com/og-image.png',
  ogImageAlt = 'ApplyTrak - Job Application Tracker Dashboard',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  twitterCreator = '@ApplyTrakApp',
  noIndex = false,
  structuredData,
  additionalMeta = []
}) => {
  const fullTitle = title.includes('ApplyTrak') ? title : `${title} | ApplyTrak`;
  const keywordsString = keywords.join(', ');
  
  // Default structured data for ApplyTrak
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ApplyTrak",
    "description": description,
    "url": canonicalUrl,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Person",
      "name": "KrishnaSathvik",
      "url": "https://github.com/KrishnaSathvik"
    },
    "datePublished": "2024",
    "screenshot": ogImage,
    "softwareVersion": "1.0.0",
    "featureList": [
      "Job Application Tracking",
      "Analytics Dashboard", 
      "Goal Setting and Progress Tracking",
      "Export and Import Data",
      "Dark/Light Theme",
      "Offline Support",
      "Privacy-First Design"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    },
    "potentialAction": {
      "@type": "UseAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://applytrak.com/marketing"
      },
      "name": "Start Job Tracking"
    },
    "softwareHelp": {
      "@type": "CreativeWork",
      "name": "ApplyTrak Help Center",
      "url": "https://applytrak.com/help"
    }
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsString} />
      <meta name="author" content="KrishnaSathvik" />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="ApplyTrak" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={ogImageAlt} />
      <meta name="twitter:creator" content={twitterCreator} />
      <meta name="twitter:site" content={twitterCreator} />

      {/* Additional Meta Tags */}
      {additionalMeta.map((meta, index) => (
        <meta
          key={index}
          {...(meta.name ? { name: meta.name } : {})}
          {...(meta.property ? { property: meta.property } : {})}
          content={meta.content}
        />
      ))}

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>

      {/* Security Headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      
      {/* Performance & Core Web Vitals */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="ApplyTrak" />
      
      {/* Additional SEO Meta */}
      <meta name="application-name" content="ApplyTrak" />
      <meta name="msapplication-TileColor" content="#3b82f6" />
      <meta name="msapplication-config" content="/browserconfig.xml" />

      {/* Theme & Color */}
      <meta name="theme-color" content="#3b82f6" />
      <meta name="color-scheme" content="light dark" />
    </Helmet>
  );
};

export default SEOHead;
