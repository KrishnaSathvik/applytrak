// src/components/seo/StructuredData.tsx - Rich Structured Data Components
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface JobApplicationStructuredDataProps {
  applications: Array<{
    id: string;
    company: string;
    position: string;
    status: string;
    appliedDate: string;
    location?: string;
  }>;
}

export const JobApplicationStructuredData: React.FC<JobApplicationStructuredDataProps> = ({ applications }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Job Applications",
    "description": "List of job applications tracked in ApplyTrak",
    "numberOfItems": applications.length,
    "itemListElement": applications.map((app, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "JobApplication",
        "name": `${app.position} at ${app.company}`,
        "description": `Job application for ${app.position} position at ${app.company}`,
        "datePosted": app.appliedDate,
        "hiringOrganization": {
          "@type": "Organization",
          "name": app.company,
          "address": app.location ? {
            "@type": "PostalAddress",
            "addressLocality": app.location
          } : undefined
        },
        "applicationStatus": app.status
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

interface CareerGoalStructuredDataProps {
  goals: Array<{
    id: string;
    title: string;
    description: string;
    targetDate: string;
    status: string;
    progress: number;
  }>;
}

export const CareerGoalStructuredData: React.FC<CareerGoalStructuredDataProps> = ({ goals }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Career Goals",
    "description": "Career goals and objectives tracked in ApplyTrak",
    "numberOfItems": goals.length,
    "itemListElement": goals.map((goal, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Goal",
        "name": goal.title,
        "description": goal.description,
        "targetDate": goal.targetDate,
        "status": goal.status,
        "progress": goal.progress
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

interface BreadcrumbStructuredDataProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export const BreadcrumbStructuredData: React.FC<BreadcrumbStructuredDataProps> = ({ items }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

interface FAQStructuredDataProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export const FAQStructuredData: React.FC<FAQStructuredDataProps> = ({ faqs }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

interface OrganizationStructuredDataProps {
  name?: string;
  description?: string;
  url?: string;
  logo?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  socialMedia?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

export const OrganizationStructuredData: React.FC<OrganizationStructuredDataProps> = ({
  name = "ApplyTrak",
  description = "Job application tracking and career management platform",
  url = "https://applytrak.com",
  logo = "https://applytrak.com/logo.png",
  contactInfo,
  socialMedia
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": name,
    "description": description,
    "url": url,
    "logo": logo,
    "foundingDate": "2024",
    "founder": {
      "@type": "Person",
      "name": "KrishnaSathvik",
      "url": "https://github.com/KrishnaSathvik"
    },
    "sameAs": socialMedia ? Object.values(socialMedia).filter(Boolean) : undefined,
    "contactPoint": contactInfo ? {
      "@type": "ContactPoint",
      "email": contactInfo.email,
      "telephone": contactInfo.phone,
      "contactType": "customer service"
    } : undefined,
    "address": contactInfo?.address ? {
      "@type": "PostalAddress",
      "addressLocality": contactInfo.address
    } : undefined
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

interface SoftwareApplicationStructuredDataProps {
  name?: string;
  description?: string;
  url?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: {
    price?: string;
    priceCurrency?: string;
  };
  featureList?: string[];
  screenshot?: string;
  aggregateRating?: {
    ratingValue: string;
    ratingCount: string;
  };
}

export const SoftwareApplicationStructuredData: React.FC<SoftwareApplicationStructuredDataProps> = ({
  name = "ApplyTrak",
  description = "Track your job search journey with analytics, goals, and smart organization",
  url = "https://applytrak.com",
  applicationCategory = "BusinessApplication",
  operatingSystem = "Web Browser",
  offers = {
    price: "0",
    priceCurrency: "USD"
  },
  featureList = [
    "Job Application Tracking",
    "Analytics Dashboard",
    "Goal Setting and Progress Tracking",
    "Export and Import Data",
    "Dark/Light Theme",
    "Offline Support"
  ],
  screenshot = "https://applytrak.com/screenshot.png",
  aggregateRating
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": name,
    "description": description,
    "url": url,
    "applicationCategory": applicationCategory,
    "operatingSystem": operatingSystem,
    "offers": {
      "@type": "Offer",
      "price": offers.price,
      "priceCurrency": offers.priceCurrency
    },
    "creator": {
      "@type": "Person",
      "name": "KrishnaSathvik",
      "url": "https://github.com/KrishnaSathvik"
    },
    "datePublished": "2024",
    "screenshot": screenshot,
    "softwareVersion": "1.0.0",
    "featureList": featureList,
    "aggregateRating": aggregateRating ? {
      "@type": "AggregateRating",
      "ratingValue": aggregateRating.ratingValue,
      "ratingCount": aggregateRating.ratingCount
    } : undefined
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default {
  JobApplicationStructuredData,
  CareerGoalStructuredData,
  BreadcrumbStructuredData,
  FAQStructuredData,
  OrganizationStructuredData,
  SoftwareApplicationStructuredData
};
