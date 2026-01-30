// src/app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://fiambond.com'; // Replace with your actual domain

  // Public Marketing & Legal Routes
  const publicRoutes = [
    '',
    '/terms',
    '/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 1,
  }));

  // Auth Routes
  const authRoutes = [
    '/login',
    '/register',
    '/verify-email',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'yearly' as const,
    priority: 0.8,
  }));

  // Realm Entry Points (Pages handled by src/pages/realm)
  // Note: These are usually private, but including the base paths 
  // can help with structure index if needed.
  const realmRoutes = [
    '/realm/admin',
    '/realm/family',
    '/realm/company',
    '/realm/personal',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [...publicRoutes, ...authRoutes, ...realmRoutes];
}