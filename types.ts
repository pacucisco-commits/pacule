
export interface Product {
  title: string;
  description: string;
  images: string[];
  variations: string[];
  supplierPrice: number;
}

export interface AdCreative {
  videoScript: string;
  lifestyleImages: string[];
  adCopy: {
    tiktok: string;
    facebook: string;
    reels: string;
  };
}

export interface SalesPage {
  headline: string;
  opening: string;
  benefits: { icon: string; title: string; text: string }[];
  howItWorks: string;
  testimonials: { name: string; text: string; rating: number }[];
  urgency: string;
  cta: string;
}

export enum AppStep {
  IMPORT = 'IMPORT',
  CREATIVES = 'CREATIVES',
  SALES_PAGE = 'SALES_PAGE',
}

export enum Language {
    PORTUGUESE = 'Portuguese',
    ENGLISH = 'English',
    SPANISH = 'Spanish',
}
