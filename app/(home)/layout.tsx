import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "ArtMaster — AI Poster Generator That Posts for You Every Day",
  description:
    "Stop manually creating social media posts. ArtMaster uses AI to generate beautiful branded posters every morning — tailored to your colors, logo, and audience. No designer needed. Perfect for African businesses.",
  alternates: { canonical: "https://artmasterpro.com" },
  openGraph: {
    title:
      "ArtMaster — AI Poster Generator That Posts for You Every Day",
    description:
      "Stop manually creating social media posts. ArtMaster generates branded posters every day, automatically.",
    url: "https://artmasterpro.com",
    images: [
      {
        url: "/og/home.png",
        width: 1200,
        height: 630,
        alt: "ArtMaster dashboard",
      },
    ],
  },
};

const ORGANIZATION_JSON = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ArtMaster",
  url: "https://artmasterpro.com",
  logo: "https://artmasterpro.com/favicon/favicon-96x96.png",
  description:
    "AI-powered daily social media poster generator built for African businesses.",
  foundingLocation: { "@type": "Place", name: "Tanzania, Africa" },
  areaServed: [
    "Tanzania",
    "Kenya",
    "Nigeria",
    "Ghana",
    "Uganda",
    "Rwanda",
    "South Africa",
    "Worldwide",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "support@artmasterpro.com",
  },
  sameAs: [
    "https://instagram.com/artmasterpro",
    "https://twitter.com/artmasterpro",
  ],
};

const SOFTWARE_JSON = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ArtMaster",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://artmasterpro.com",
  description:
    "AI platform that automatically generates branded social media posters every day for African businesses.",
  featureList: [
    "AI poster generation",
    "Brand kit system",
    "Daily scheduling",
    "Instagram auto-posting",
    "Occasion-aware content for Africa",
    "Multiple platform formats",
  ],
  screenshot: "https://artmasterpro.com/og/home.png",
  offers: [
    {
      "@type": "Offer",
      name: "Free Plan",
      price: "0",
      priceCurrency: "USD",
      description: "5 AI posters per month, 1 brand kit",
    },
    {
      "@type": "Offer",
      name: "Pro Plan",
      price: "12",
      priceCurrency: "USD",
      description: "60 AI posters per month, 3 brand kits, scheduling",
    },
    {
      "@type": "Offer",
      name: "Business Plan",
      price: "24",
      priceCurrency: "USD",
      description: "Unlimited posters, unlimited brand kits, API access",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "120",
  },
};

const FAQ_JSON = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is ArtMaster?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ArtMaster is an AI-powered platform that automatically generates branded social media posters every day based on your brand kit — your colors, logo, industry, and tone. Built specifically for African businesses.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need a designer to use ArtMaster?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. ArtMaster is built for business owners and marketers with no design experience. You set up your brand kit once in under 5 minutes, and AI generates professional posters every day automatically.",
      },
    },
    {
      "@type": "Question",
      name: "Is ArtMaster free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. ArtMaster has a free plan with 5 AI poster generations per month and 1 brand kit. Pro ($12/mo) gives 60 posters. Business ($24/mo) is unlimited. No credit card required to start.",
      },
    },
    {
      "@type": "Question",
      name: "Does ArtMaster work for African businesses?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ArtMaster was built specifically for the African market. It understands local holidays, occasions, and cultural moments across Tanzania, Kenya, Nigeria, Ghana, and 40+ countries. It supports mobile money payments and local currencies.",
      },
    },
    {
      "@type": "Question",
      name: "Can ArtMaster post to Instagram automatically?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Connect your Instagram Business account and ArtMaster will automatically publish your daily AI-generated poster at your scheduled time.",
      },
    },
    {
      "@type": "Question",
      name: "What social media platforms does ArtMaster support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ArtMaster generates posters for Instagram (Square, Portrait, Story/Reels), Facebook, TikTok, X (Twitter), LinkedIn, YouTube thumbnails, and Pinterest — all with the correct dimensions.",
      },
    },
    {
      "@type": "Question",
      name: "Is ArtMaster a Canva alternative?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ArtMaster is different from Canva. Canva is a manual design tool. ArtMaster is fully automated — it generates your posters daily without you touching a thing, using your brand kit as the creative brief.",
      },
    },
  ],
};

const WEBSITE_JSON = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ArtMaster",
  url: "https://artmasterpro.com",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://artmasterpro.com/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_JSON) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON) }}
      />
      {children}
    </>
  );
}
