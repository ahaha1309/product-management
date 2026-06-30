const Product = require('../../models/product.model');
const Category = require('../../models/product-category.model');

module.exports.index = async (req, res) => {
  try {
    const baseUrl = 'https://vanhatech.com'; // In a real app, this should come from env or req.protocol + '://' + req.get('host')

    // Fetch dynamic content
    const products = await Product.find({ status: 'active', deleted: false }).select('slug updatedAt');
    const categories = await Category.find({ status: 'active', deleted: false }).select('slug updatedAt');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/product</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;

    // Add Categories
    categories.forEach(category => {
      xml += `  <url>
    <loc>${baseUrl}/product/c/${category.slug}</loc>
    <lastmod>${category.updatedAt ? category.updatedAt.toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    });

    // Add Products
    products.forEach(product => {
      xml += `  <url>
    <loc>${baseUrl}/product/detail/${product.slug}</loc>
    <lastmod>${product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).end();
  }
};
