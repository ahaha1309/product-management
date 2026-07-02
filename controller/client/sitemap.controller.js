const Product = require('../../models/product.model');
const Category = require('../../models/product-category.model');

module.exports.generateSitemap = async (req, res) => {
  try {
    const baseUrl = req.protocol + '://' + req.get('host');
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // 1. Static Pages
    const staticPages = [
      '',
      '/product',
      '/about',
      '/contact'
    ];

    for (const page of staticPages) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page}</loc>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>1.0</priority>\n';
      xml += '  </url>\n';
    }

    // 2. Categories
    const categories = await Category.find({ status: 'active', deleted: false });
    for (const cat of categories) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/product/${cat.slug}</loc>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    // 3. Products
    const products = await Product.find({ status: 'active', deleted: false });
    for (const prod of products) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/product/detail/${prod.slug}</loc>\n`;
      xml += `    <lastmod>${prod.updatedAt ? new Date(prod.updatedAt).toISOString() : new Date().toISOString()}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Lỗi tạo sitemap:', error);
    res.status(500).end();
  }
};
