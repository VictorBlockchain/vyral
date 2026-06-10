import { MetadataRoute } from 'next';

const baseUrl = 'https://vyral.buzz';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/dashboard`, lastModified: new Date() },
    { url: `${baseUrl}/wallet`, lastModified: new Date() },
    { url: `${baseUrl}/uikit`, lastModified: new Date() },
    { url: `${baseUrl}/profile`, lastModified: new Date() },
    { url: `${baseUrl}/about`, lastModified: new Date() },
    { url: `${baseUrl}/terms`, lastModified: new Date() },
    { url: `${baseUrl}/design`, lastModified: new Date() },
    { url: `${baseUrl}/contact`, lastModified: new Date() },
  ];
}
