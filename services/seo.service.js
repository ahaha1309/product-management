/**
 * SEO Meta Builder Service
 * Pure stateless function to build Meta Tags, Open Graph, and JSON-LD.
 * Prevents God Service risk by NOT querying the database directly.
 */

const DEFAULT_IMAGE = '/image/promo_banner.png'; // Using the promo banner as default per request
const DEFAULT_TITLE = 'NVH Mall - Premium E-commerce';
const DEFAULT_DESC = 'NVH Mall - Nơi cung cấp các sản phẩm công nghệ chính hãng, uy tín với giá cả tốt nhất thị trường.';

module.exports.buildMeta = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  url = 'https://vanhatech.com/',
  image = DEFAULT_IMAGE,
  type = 'website',
  jsonLd = []
}) => {
  return {
    title,
    metaTags: [
      { name: 'description', content: description },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0' }
    ],
    openGraph: [
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      { property: 'og:site_name', content: 'NVH Mall' }
    ],
    jsonLd: Array.isArray(jsonLd) ? jsonLd : [jsonLd]
  };
};
