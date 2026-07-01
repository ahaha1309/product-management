require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product.model');
const Supplier = require('./models/supplier.model');

// Dữ liệu nhà cung cấp chính thức
const officialSuppliers = {
  'Xiaomi': {
    name: 'Xiaomi Việt Nam',
    email: 'service.vn@xiaomi.com',
    phone: '1900 6015',
    address: 'Tầng 11, Tòa nhà Bitexco, Số 2 Hải Triều, Quận 1, TP.HCM'
  },
  'POCO': {
    name: 'POCO Việt Nam (Xiaomi)',
    email: 'service.vn@xiaomi.com',
    phone: '1900 6015',
    address: 'Tầng 11, Tòa nhà Bitexco, Số 2 Hải Triều, Quận 1, TP.HCM'
  },
  'Sony': {
    name: 'Sony Electronics Việt Nam',
    email: 'sev.contact@sony.com',
    phone: '1800 588885',
    address: 'Tầng 6, Tòa nhà President Place, 93 Nguyễn Du, Quận 1, TP.HCM'
  },
  'Samsung': {
    name: 'Samsung Vina Electronics',
    email: 'contact@samsung.com.vn',
    phone: '1800 588889',
    address: 'Tòa nhà Bitexco, Số 2 Hải Triều, Quận 1, TP.HCM'
  },
  'Dell': {
    name: 'Dell Technologies Việt Nam',
    email: 'vn_support@dell.com',
    phone: '1800 545455',
    address: 'Tầng 23, Tòa nhà A&B, 76A Lê Lai, Quận 1, TP.HCM'
  },
  'Lenovo': {
    name: 'Lenovo Việt Nam',
    email: 'aseanvn@lenovo.com',
    phone: '120 11072',
    address: 'Tầng 15, Tòa nhà CJ, Số 6 Lê Thánh Tôn, Quận 1, TP.HCM'
  },
  'Itel': {
    name: 'Itel Mobile Việt Nam',
    email: 'service@itel-mobile.com',
    phone: '1900 2000',
    address: 'TP.HCM, Việt Nam'
  },
  'Tecno': {
    name: 'Tecno Mobile Việt Nam',
    email: 'service.vn@tecno-mobile.com',
    phone: '1800 2000',
    address: 'TP.HCM, Việt Nam'
  },
  'Apple': {
    name: 'Apple Việt Nam',
    email: 'support@apple.com',
    phone: '1800 1127',
    address: 'Phòng 901, Tòa nhà Ngôi Nhà Đức, 33 Lê Duẩn, Quận 1, TP.HCM'
  },
  'OPPO': {
    name: 'OPPO Việt Nam',
    email: 'support.vn@oppo.com',
    phone: '1800 577776',
    address: 'Tầng 12, Tòa nhà Viettel, 285 Cách Mạng Tháng 8, Quận 10, TP.HCM'
  },
  'ASUS': {
    name: 'ASUS Việt Nam',
    email: 'support_vn@asus.com',
    phone: '1800 6588',
    address: 'Tầng 1, Tòa nhà Viettel, 285 Cách Mạng Tháng 8, Quận 10, TP.HCM'
  },
  'Acer': {
    name: 'Acer Việt Nam',
    email: 'acer.vietnam@acer.com',
    phone: '1900 969601',
    address: 'Tầng 1, Tòa nhà Đinh Lễ, Quận 4, TP.HCM'
  },
  'HP': {
    name: 'HP Việt Nam',
    email: 'cskh.hp@hp.com',
    phone: '1800 588868',
    address: 'Tầng 10, Tòa nhà Sài Gòn Tower, 29 Lê Duẩn, Quận 1, TP.HCM'
  },
  'SIMTHCE': {
    name: 'SIMTHCE Mobile',
    email: '',
    phone: '',
    address: ''
  }
};

const extractBrand = (title) => {
  const t = title.toLowerCase();
  if (t.includes('iphone') || t.includes('macbook') || t.includes('ipad') || t.includes('apple')) return 'Apple';
  if (t.includes('samsung') || t.includes('galaxy') || t.includes('s24') || t.includes('galax')) return 'Samsung';
  if (t.includes('xiaomi') || t.includes('redmi')) return 'Xiaomi';
  if (t.includes('poco')) return 'POCO';
  if (t.includes('oppo')) return 'OPPO';
  if (t.includes('vivo')) return 'Vivo';
  if (t.includes('asus') || t.includes('rog')) return 'ASUS';
  if (t.includes('dell')) return 'Dell';
  if (t.includes('hp')) return 'HP';
  if (t.includes('lenovo') || t.includes('thinkpad')) return 'Lenovo';
  if (t.includes('acer') || t.includes('predator')) return 'Acer';
  if (t.includes('msi')) return 'MSI';
  if (t.includes('sony')) return 'Sony';
  if (t.includes('itel')) return 'Itel';
  if (t.includes('tecno')) return 'Tecno';
  if (t.includes('simthce')) return 'SIMTHCE';

  return null; // Cannot determine
};

mongoose.connect(process.env.MONGO_URL).then(async () => {
  try {
    const products = await Product.find({ deleted: false });
    
    // Group products by brand
    const groupedProducts = {};
    const unknownProducts = [];

    products.forEach(p => {
      let brand = p.brand;
      if (!brand || brand === 'Unknown') {
        brand = extractBrand(p.title);
      }

      if (brand) {
        // Normalize name just in case
        if (officialSuppliers[brand]) {
          if (!groupedProducts[brand]) groupedProducts[brand] = [];
          groupedProducts[brand].push(p);
        } else {
          unknownProducts.push(p);
        }
      } else {
        unknownProducts.push(p);
      }
    });

    let createdCount = 0;

    // Process each identified brand
    for (const [brandCode, items] of Object.entries(groupedProducts)) {
      const info = officialSuppliers[brandCode];
      
      // Check if supplier already exists
      let supplier = await Supplier.findOne({ name: info.name });
      
      if (!supplier) {
        supplier = new Supplier({
          name: info.name,
          email: info.email || '',
          phone: info.phone || '',
          address: info.address || '',
          status: 'active',
          deleted: false
        });
        await supplier.save();
        createdCount++;
      }

      // Update supplierId for all products of this supplier
      for (const p of items) {
        p.supplier_id = supplier._id.toString();
        await p.save();
      }
      
      console.log(`- Đã gán ${items.length} sản phẩm cho nhà cung cấp: ${info.name}`);
    }

    console.log('\n=============================================');
    console.log(`✅ Đã tạo mới ${createdCount} nhà cung cấp.`);
    console.log(`⚠️ Có ${unknownProducts.length} sản phẩm không thể xác định nhà cung cấp.`);
    
    if (unknownProducts.length > 0) {
      console.log('\nDanh sách 20 sản phẩm đầu tiên không xác định được nhà cung cấp:');
      unknownProducts.slice(0, 20).forEach(p => console.log(`   - ${p.title}`));
    }

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
});
