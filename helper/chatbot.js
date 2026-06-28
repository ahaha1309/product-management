require('dotenv').config();

const Product = require('../models/product.model');

const API_KEY = process.env.GOOGLE_API_KEY;

// ===== SHOP CONFIG (Từ .env) =====
const SHOP_CONFIG = {
    shopName: process.env.SHOP_NAME || 'Cửa hàng',
    address: process.env.SHOP_ADDRESS || 'Mê Linh, TP.Hà Nội',
    hotline: process.env.SHOP_HOTLINE || '0886911891',
    email: process.env.SHOP_EMAIL || 'vanhanguyen2k4@shop.com',
    openTime: process.env.SHOP_OPEN_TIME || '08:00',
    closeTime: process.env.SHOP_CLOSE_TIME || '22:00',
    shippingDays: process.env.SHOP_SHIPPING_DAYS || '1-3 ngày',
    freeShippingThreshold: parseInt(process.env.SHOP_FREE_SHIPPING_THRESHOLD) || 500000,
    warranty: process.env.SHOP_WARRANTY || '1-2 năm (tùy sản phẩm)',
    returnPolicy: process.env.SHOP_RETURN_POLICY || '7 ngày đổi trả hoàn tiền 100%',
    paymentMethods: (process.env.SHOP_PAYMENT_METHODS || 'Thanh toán khi nhận,Chuyển khoản,Ví điện tử').split(',')
};

// ===== RATE LIMITING =====
const rateLimitMap = new Map();
const REQUESTS_PER_MINUTE = 10;
const TIME_WINDOW = 60 * 1000;

/**
 * ✅ Check rate limit per user
 */
function checkRateLimit(userId) {
    const now = Date.now();
    
    if (!rateLimitMap.has(userId)) {
        rateLimitMap.set(userId, []);
    }
    
    const requests = rateLimitMap.get(userId);
    const validRequests = requests.filter(time => now - time < TIME_WINDOW);
    rateLimitMap.set(userId, validRequests);
    
    if (validRequests.length >= REQUESTS_PER_MINUTE) {
        return false;
    }
    
    validRequests.push(now);
    return true;
}

if (!API_KEY) {
    console.error('❌ GOOGLE_API_KEY is not set in .env file');
}

// ===== QUESTION DETECTION =====

/**
 * ✅ Extract keywords từ câu hỏi
 */
function extractKeywords(question) {
    return question
        .toLowerCase()
        .replace(/[^\w\s\u0100-\u017F]/g, '')
        .split(/\s+/)
        .filter(word => word.length >= 2)
        .slice(0, 5);
}

/**
 * ✅ Detect loại câu hỏi với keyword matching
 */
/**
 * ✅ Detect loại câu hỏi
 */
function detectQuestionType(question) {
    const lowerQuestion = question.toLowerCase();

    const patterns = {
        listing: ['giới thiệu', 'xem sản phẩm', 'danh sách', 'tiếp theo', 'sản phẩm khác'],
        compare: ['so sánh', 'tốt hơn', 'khác nhau', 'nên chọn cái nào', 'giữa'],
        search: ['tìm', 'search', 'có', 'bán', 'sản phẩm', 'iphone', 'ip', 'laptop', 'nước hoa', 'samsung', 'xiaomi'],
        price: ['giá', 'bao nhiêu', 'rẻ', 'đắt', 'so sánh giá', 'giá tốt'],
        stock: ['còn hàng', 'hết hàng', 'kho', 'stock', 'còn không', 'bao lâu có'],
        voucher: ['voucher', 'mã', 'giảm', 'khuyến mãi', 'sale', 'discount', 'coupon'],
        payment: ['thanh toán', 'trả góp', 'visa', 'thẻ', 'ví', 'payment'],
        shipping: ['giao', 'ship', 'vận chuyển', 'phí', 'delivery', 'miễn phí'],
        warranty: ['bảo hành', 'đổi trả', 'warranty', 'return', 'hoàn tiền'],
        general: ['giờ hoạt động', 'địa chỉ', 'liên hệ', 'email', 'hotline', 'hỗ trợ', 'tư vấn']
    };

    let scores = {};
    for (const [type, keywords] of Object.entries(patterns)) {
        scores[type] = keywords.filter(kw => lowerQuestion.includes(kw)).length;
    }

    const maxScore = Math.max(...Object.values(scores));
    const questionType = maxScore > 0 
        ? Object.keys(scores).find(key => scores[key] === maxScore)
        : 'other';

    console.log(`🎯 Question type: ${questionType} (score: ${maxScore})`);

    return {
        questionType,
        scores,
        confidence: maxScore / Object.keys(patterns).length
    };
}
// ===== PRODUCT QUERIES =====

/**
 * ✅ Lấy sản phẩm theo trang
 */
async function getShopProductsPaginated(page = 1, limit = 5) {
    try {
        page = Math.max(1, parseInt(page) || 1);
        limit = Math.max(1, Math.min(10, parseInt(limit) || 5));

        const skip = (page - 1) * limit;
        const total = await Product.countDocuments({ status: 'active' });

        if (total === 0) {
            console.warn('⚠️ No active products found');
            return {
                products: [],
                currentPage: page,
                totalPages: 0,
                totalProducts: 0,
                limit: limit
            };
        }

        const products = await Product.find({ status: 'active' })
            .select('_id title description price discountPercentage stock category thumbnail slug')
            .skip(skip)
            .lean();

        const formattedProducts = products.map(p => ({
            id: p._id?.toString() || '',
            slug: p.slug || '',
            name: p.title || p.name || 'Không có tên',
            price: `${(p.price || 0).toLocaleString('vi-VN')}đ`,
            priceRaw: p.price || 0,
            finalPrice: Math.round((p.price || 0) * (1 - ((p.discountPercentage || 0) / 100))),
            description: (p.description || 'Không có mô tả').substring(0, 100),
            discount: Math.min(100, Math.max(0, p.discountPercentage || 0)),
            category: p.category || 'Không phân loại',
            stock: Math.max(0, p.stock || 0),
            thumbnail: p.thumbnail || '/image/no-product.png'
        }));

        return {
            products: formattedProducts,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalProducts: total,
            limit: limit
        };
    } catch (error) {
        console.error('❌ Error fetching paginated products:', error);
        return {
            products: [],
            currentPage: page,
            totalPages: 0,
            totalProducts: 0,
            limit: limit
        };
    }
}

/**
 * ✅ Lấy TẤT CẢ sản phẩm
 */
async function getAllShopProducts(limit = 100) {
    try {
        const products = await Product.find({ status: 'active' })
            .select('_id title description price discountPercentage stock category thumbnail slug')
            .lean();

        if (products.length === 0) {
            console.warn('⚠️ No active products found');
            return [];
        }

        return products.map(p => ({
            id: p._id?.toString() || '',
            slug: p.slug || '',
            name: p.title || p.name || 'Không có tên',
            price: `${(p.price || 0).toLocaleString('vi-VN')}đ`,
            priceRaw: p.price || 0,
            finalPrice: Math.round((p.price || 0) * (1 - ((p.discountPercentage || 0) / 100))),
            description: (p.description || 'Không có mô tả').substring(0, 150),
            discount: Math.min(100, Math.max(0, p.discountPercentage || 0)),
            category: p.category || 'Không phân loại',
            stock: Math.max(0, p.stock || 0),
            thumbnail: p.thumbnail || '/image/no-product.png'
        }));
    } catch (error) {
        console.error('❌ Error fetching all products:', error);
        return [];
    }
}

/**
 * ✅ Tìm sản phẩm theo keyword
 */
/**
 * ✅ Tìm sản phẩm theo keyword - OPTIMIZED
 */
async function searchProducts(keyword, limit = 15) {
    try {
        if (!keyword || keyword.trim().length === 0) {
            return [];
        }

        // 🔍 Normalize keyword
        const normalizedKeyword = keyword.toLowerCase().trim();

        console.log(`🔎 Searching for: "${normalizedKeyword}"`);

        // 📊 Tạo regex pattern linh hoạt
        const patterns = [
            { regex: new RegExp(`^${normalizedKeyword}$`, 'i'), score: 100 },
            { regex: new RegExp(`^${normalizedKeyword}`, 'i'), score: 90 },
            { regex: new RegExp(`${normalizedKeyword}$`, 'i'), score: 80 },
            { regex: new RegExp(normalizedKeyword, 'i'), score: 70 },
            { regex: new RegExp(`\\b${normalizedKeyword}`, 'i'), score: 75 }
        ];

        // 🔎 Tìm kiếm sản phẩm
        const products = await Product.find({ status: 'active' })
            .select('_id title description price discountPercentage stock category thumbnail slug')
            .limit(limit * 2)
            .lean();

        if (products.length === 0) {
            console.log(`⚠️ No products in database`);
            return [];
        }

        console.log(`📦 Total active products: ${products.length}`);

        // 📊 Score products
        const scoredProducts = products.map(p => {
            let maxScore = 0;
            let matchedFields = [];

            const title = (p.title || '').toLowerCase();
            const description = (p.description || '').toLowerCase();
            const category = (p.category || '').toLowerCase();

            // Kiểm tra mỗi pattern cho full keyword
            for (const { regex, score } of patterns) {
                if (regex.test(title)) {
                    maxScore = Math.max(maxScore, score + 30);
                    matchedFields.push(`title:"${p.title}"`);
                }
                if (regex.test(description)) {
                    maxScore = Math.max(maxScore, score + 15);
                    matchedFields.push('description');
                }
                if (regex.test(category)) {
                    maxScore = Math.max(maxScore, score + 10);
                    matchedFields.push('category');
                }
            }

            // 🌟 NEW: Token-based matching (giúp tìm "Đồng hồ thông minh" từ "tôi cần mua đồng hồ thông minh")
            const tokens = normalizedKeyword.split(/\s+/).filter(t => t.length >= 2);
            let tokenMatches = 0;
            for (const token of tokens) {
                if (title.includes(token) || description.includes(token) || category.includes(token)) {
                    tokenMatches++;
                }
            }
            if (tokenMatches > 0) {
                maxScore += (tokenMatches * 10);
                matchedFields.push(`tokens:${tokenMatches}`);
            }

            return {
                id: p._id?.toString() || '',
                slug: p.slug || '',
                name: p.title || 'Không có tên',
                price: `${(p.price || 0).toLocaleString('vi-VN')}đ`,
                priceRaw: p.price || 0,
                finalPrice: Math.round((p.price || 0) * (1 - ((p.discountPercentage || 0) / 100))),
                description: (p.description || 'Không có mô tả').substring(0, 100),
                discount: Math.min(100, Math.max(0, p.discountPercentage || 0)),
                category: p.category || 'Không phân loại',
                stock: Math.max(0, p.stock || 0),
                thumbnail: p.thumbnail || '/image/no-product.png',
                relevanceScore: maxScore,
                matchedFields: matchedFields
            };
        })
            .filter(p => p.relevanceScore > 0)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit);

        console.log(`✅ Found ${scoredProducts.length} matching products`);
        if (scoredProducts.length > 0) {
            console.log('Matched products:', scoredProducts.map(p => ({ 
                name: p.name, 
                score: p.relevanceScore,
                fields: p.matchedFields 
            })));
        }

        return scoredProducts;
    } catch (error) {
        console.error('❌ Error searching products:', error);
        return [];
    }
}

// ===== PRODUCT CONTEXT FORMATTING =====

/**
 * ✅ Format product context dựa trên question type
 */
async function getProductContext(questionType, session = {}, history = [], currentQuestion = '') {
    let productContext = '';
    let paginationData = null;
    let searchResults = [];
    let allProducts = [];

    try {
        switch (questionType.questionType) {
case 'search': {
    console.log('🔍 SEARCH: Starting search...');
    
    let searchKeyword = currentQuestion.toLowerCase()
        .replace(/tôi|cần|tư vấn|về|sản phẩm|cái|chiếc|này|cho|hỏi|mua|xem|có/g, ' ')
        .replace(/[:!?.,]/g, ' ')
        .trim();
        
    if (!searchKeyword) searchKeyword = currentQuestion; // Fallback
    
    console.log('📝 Raw question:', currentQuestion);
    console.log(`\n🔎 ════════════════════════════`);
    console.log(`   Searching for: "${searchKeyword}"`);
    console.log(`════════════════════════════\n`);
    
    // Luôn luôn search
    if (true) {
        searchResults = await searchProducts(searchKeyword, 10);
        
        console.log(`\n📊 ════════════════════════════`);
        console.log(`   Results: ${searchResults.length} products`);
        if (searchResults.length > 0) {
            searchResults.forEach((p, i) => {
                console.log(`   ${i + 1}. ${p.name} (score: ${p.relevanceScore})`);
            });
        }
        console.log(`════════════════════════════\n`);
    }

    if (searchResults.length > 0) {
        productContext = `\n\n🔍 **KẾT QUẢ TÌM KIẾM** (${searchResults.length} sản phẩm)\n`;
        productContext += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        searchResults.forEach((product, index) => {
            const discountPrice = product.finalPrice ? 
                `${product.finalPrice.toLocaleString('vi-VN')}đ` : 
                product.price;
            
            productContext += `${index + 1}. **${product.name}**\n`;
            productContext += `   💰 Giá: ${product.price}`;
            if (product.discount > 0) {
                productContext += ` → **${discountPrice}** (${product.discount}% OFF)`;
            }
            productContext += `\n`;
            productContext += `   📂 ${product.category}\n`;
            productContext += `   📝 ${product.description}\n`;
            productContext += `   📦 ${product.stock > 0 ? `✅ ${product.stock} cái` : '❌ Hết hàng'}\n\n`;
        });
    } else {
        const fallbackProducts = await getAllShopProducts();
        productContext = `\n\n❌ **TÌM KIẾM CƠ BẢN KHÔNG THẤY TỪ KHÓA CHÍNH XÁC**\n\n`;
        productContext += `Tuy nhiên, bạn (AI) là một trợ lý thông minh. Hãy đọc danh sách sản phẩm dưới đây của cửa hàng và tự suy luận ngữ nghĩa để tìm ra sản phẩm phù hợp nhất với câu hỏi của khách hàng (Ví dụ: khách hỏi "công nghệ" thì bạn tự tìm các sản phẩm thuộc danh mục "điện tử, máy tính, điện thoại", khách hỏi "thời trang" thì tìm quần áo).\n\n`;
        if (fallbackProducts.length > 0) {
            productContext += `📦 **DANH SÁCH SẢN PHẨM HIỆN CÓ ĐỂ BẠN TÌM KIẾM VÀ TƯ VẤN**:\n`;
            fallbackProducts.slice(0, 30).forEach((product, index) => {
                productContext += `${index + 1}. **${product.name}** - ${product.price}\n`;
                productContext += `   📂 Danh mục: ${product.category}\n`;
                productContext += `   📝 Mô tả: ${product.description}\n\n`;
            });
        } else {
            productContext += `Hiện tại cửa hàng không có sản phẩm nào.`;
        }
    }
    break;};
            case 'price': {
                console.log('💰 PRICE: Analyzing price...');
                
                allProducts = await getAllShopProducts();
                
                if (allProducts.length > 0) {
                    const inStockProducts = allProducts.filter(p => p.stock > 0);
                    const sortedByPrice = [...inStockProducts].sort((a, b) => a.priceRaw - b.priceRaw);
                    
                    if (sortedByPrice.length > 0) {
                        productContext = `\n\n💰 **PHÂN TÍCH GIÁ CẢ**\n`;
                        productContext += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                        
                        const cheapest = sortedByPrice[0];
                        const mostExpensive = sortedByPrice[sortedByPrice.length - 1];
                        const avgPrice = Math.round(sortedByPrice.reduce((a, b) => a + b.priceRaw, 0) / sortedByPrice.length);
                        
                        productContext += `🏆 **Rẻ nhất:** ${cheapest.name} - ${cheapest.price}`;
                        if (cheapest.discount > 0) productContext += ` (${cheapest.discount}% OFF)`;
                        productContext += `\n\n`;
                        
                        productContext += `👑 **Đắt nhất:** ${mostExpensive.name} - ${mostExpensive.price}\n\n`;
                        productContext += `📊 **Giá trung bình:** ${avgPrice.toLocaleString('vi-VN')}đ\n\n`;
                        
                        productContext += `**5 SẢN PHẨM RẺ NHẤT**:\n`;
                        sortedByPrice.slice(0, 5).forEach((p, i) => {
                            productContext += `${i + 1}. ${p.name} - ${p.price}`;
                            if (p.discount > 0) productContext += ` (${p.discount}%)`;
                            productContext += `\n`;
                        });
                    }
                }
                break;
            }

            case 'stock': {
                console.log('📦 STOCK: Checking inventory...');
                
                allProducts = await getAllShopProducts();
                const inStock = allProducts.filter(p => p.stock > 0);
                const outOfStock = allProducts.filter(p => p.stock === 0);
                const lowStock = allProducts.filter(p => p.stock > 0 && p.stock < 5);
                
                productContext = `\n\n📦 **TRẠNG THÁI KHO HÀNG**\n`;
                productContext += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                productContext += `✅ **Còn hàng:** ${inStock.length} sản phẩm\n`;
                productContext += `❌ **Hết hàng:** ${outOfStock.length} sản phẩm\n`;
                productContext += `⚠️ **Hàng sắp hết:** ${lowStock.length} sản phẩm\n\n`;
                
                if (lowStock.length > 0) {
                    productContext += `**SẢN PHẨM HẠN CHẾ** (< 5 cái):\n`;
                    lowStock.slice(0, 5).forEach((p, i) => {
                        productContext += `${i + 1}. ${p.name} - Còn ${p.stock} cái\n`;
                    });
                    productContext += `\n`;
                }
                
                if (inStock.length > 0) {
                    productContext += `**SẢN PHẨM CÒN HÀNG**:\n`;
                    inStock.slice(0, 10).forEach((p, i) => {
                        productContext += `${i + 1}. ${p.name} - ${p.stock} cái\n`;
                    });
                }
                break;
            }

            case 'voucher': {
                console.log('🎉 VOUCHER: Checking promotions...');
                
                allProducts = await getAllShopProducts();
                const discountedProducts = allProducts.filter(p => p.discount > 0);
                
                productContext = `\n\n🎉 **VOUCHER & KHUYẾN MÃI**\n`;
                productContext += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                productContext += `📌 **Thông tin:**\n`;
                productContext += `- Nhập mã tại trang thanh toán\n`;
                productContext += `- Có thể kết hợp với chương trình khác\n`;
                productContext += `- Liên hệ hotline để được cấp mã độc quyền\n\n`;
                
                if (discountedProducts.length > 0) {
                    productContext += `🎁 **SẢN PHẨM ĐANG GIẢM GIÁ** (${discountedProducts.length}):\n`;
                    discountedProducts.slice(0, 5).forEach((p, i) => {
                        const saved = Math.round(p.priceRaw * p.discount / 100);
                        productContext += `${i + 1}. ${p.name} - ${p.price} (Tiết kiệm: ${saved.toLocaleString('vi-VN')}đ)\n`;
                    });
                }
                break;
            }

            case 'payment': {
                console.log('💳 PAYMENT: Checking payment methods...');
                
                const paymentMethods = SHOP_CONFIG.paymentMethods.join(', ');
                
                productContext = `\n\n💳 **HÌNH THỨC THANH TOÁN**\n`;
                productContext += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                productContext += `**Phương thức:** ${paymentMethods}\n\n`;
                productContext += `✅ Thanh toán khi nhận: Không rủi ro\n`;
                productContext += `✅ Chuyển khoản: Nhận hàng nhanh\n`;
                productContext += `✅ Ví điện tử: An toàn, tiện lợi\n\n`;
                productContext += `🔒 **Bảo mật:** 100% an toàn với SSL encryption\n`;
                productContext += `💳 **Trả góp:** Liên hệ hotline để được tư vấn`;
                break;
            }

            case 'shipping': {
                console.log('🚚 SHIPPING: Checking shipping info...');
                
                productContext = `\n\n🚚 **THÔNG TIN VẬN CHUYỂN**\n`;
                productContext += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                productContext += `📦 **Phạm vi:** Toàn quốc\n`;
                productContext += `📍 **Từ:** ${SHOP_CONFIG.address}\n\n`;
                productContext += `⏱️ **Thời gian:** ${SHOP_CONFIG.shippingDays}\n`;
                productContext += `- Giao hàng Thứ Hai - Chủ Nhật (${SHOP_CONFIG.openTime} - ${SHOP_CONFIG.closeTime})\n\n`;
                productContext += `💰 **Phí vận chuyển:**\n`;
                productContext += `- Miễn phí từ ${SHOP_CONFIG.freeShippingThreshold.toLocaleString('vi-VN')}đ\n`;
                productContext += `- Phí tối đa: 50,000đ`;
                break;
            }

            case 'warranty': {
                console.log('🏷️ WARRANTY: Checking warranty info...');
                
                productContext = `\n\n🏷️ **THÔNG TIN BẢO HÀNH & ĐỔI TRẢ**\n`;
                productContext += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                productContext += `🛡️ **Bảo hành:** ${SHOP_CONFIG.warranty}\n`;
                productContext += `🔄 **Đổi trả:** ${SHOP_CONFIG.returnPolicy}\n\n`;
                productContext += `**Điều kiện:**\n`;
                productContext += `✅ Sản phẩm nguyên seal\n`;
                productContext += `✅ Đầy đủ phụ kiện\n`;
                productContext += `✅ Không lỗi người dùng\n\n`;
                productContext += `**Quy trình:**\n`;
                productContext += `1. Liên hệ hotline ${SHOP_CONFIG.hotline}\n`;
                productContext += `2. Ghi hình\n`;
                productContext += `3. Gửi sản phẩm\n`;
                productContext += `4. Xử lý 3-5 ngày`;
                break;
            }

            case 'general': {
                console.log('📋 GENERAL: Showing general info...');
                
                const paymentMethods = SHOP_CONFIG.paymentMethods.join(', ');
                
                productContext = `\n\n📋 **THÔNG TIN CỬA HÀNG**\n`;
                productContext += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                productContext += `🏪 **Tên:** ${SHOP_CONFIG.shopName}\n`;
                productContext += `📍 **Địa chỉ:** ${SHOP_CONFIG.address}\n`;
                productContext += `🕒 **Giờ:** ${SHOP_CONFIG.openTime} - ${SHOP_CONFIG.closeTime}\n`;
                productContext += `📞 **Hotline:** ${SHOP_CONFIG.hotline}\n`;
                productContext += `📧 **Email:** ${SHOP_CONFIG.email}\n`;
                productContext += `💳 **Thanh toán:** ${paymentMethods}\n`;
                productContext += `👥 **Hỗ trợ:** 24/7`;
                break;
            }

            case 'listing': {
                console.log('📄 LISTING: Showing product listing...');
                
                const isNextPage = (history?.length || 0) > 0;
                let pageToShow = session?.currentPage || 1;
                if (isNextPage) pageToShow++;

                paginationData = await getShopProductsPaginated(pageToShow, 5);
                if (session) session.currentPage = pageToShow;

                if (paginationData.products.length > 0) {
                    productContext = `\n\n📦 **DANH SÁCH SẢN PHẨM**\n`;
                    productContext += `(Trang ${pageToShow}/${paginationData.totalPages})\n`;
                    productContext += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                    
                    paginationData.products.forEach((product, index) => {
                        const productNum = (pageToShow - 1) * 5 + index + 1;
                        productContext += `${productNum}. **${product.name}**\n`;
                        productContext += `   💰 ${product.price}`;
                        if (product.discount > 0) {
                            productContext += ` → **${product.finalPrice.toLocaleString('vi-VN')}đ** (${product.discount}%)`;
                        }
                        productContext += `\n`;
                        productContext += `   📂 ${product.category}\n`;
                        productContext += `   📝 ${product.description}\n`;
                        productContext += `   📦 ${product.stock > 0 ? `✅ ${product.stock}` : '❌ Hết'}\n\n`;
                    });

                    if (paginationData.totalPages > 1) {
                        productContext += `⏭️ Hỏi "tiếp theo" để xem thêm.`;
                    }
                }
                break;
            }

            case 'compare': {
                console.log('🔄 COMPARE: Comparing products...');
                
                allProducts = await getAllShopProducts();
                
                if (allProducts.length >= 2) {
                    productContext = `\n\n🔄 **SO SÁNH SẢN PHẨM**\n`;
                    productContext += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
                    
                    const sortedByPrice = [...allProducts].sort((a, b) => a.priceRaw - b.priceRaw);
                    
                    sortedByPrice.slice(0, 5).forEach((product, index) => {
                        productContext += `${index + 1}. **${product.name}** - ${product.price}`;
                        if (product.discount > 0) productContext += ` (${product.discount}%)`;
                        productContext += `\n`;
                    });
                    
                    productContext += `\n- **Rẻ nhất:** ${sortedByPrice[0].name} (${sortedByPrice[0].price})\n`;
                    productContext += `- **Đắt nhất:** ${sortedByPrice[sortedByPrice.length - 1].name} (${sortedByPrice[sortedByPrice.length - 1].price})`;
                }
                break;
            }

            default: {
                console.log('🤷 OTHER: General response...');
                
                allProducts = await getAllShopProducts();
                if (allProducts.length > 0) {
                    productContext = `\n\n📦 **DANH SÁCH SẢN PHẨM HIỆN CÓ ĐỂ BẠN TÌM KIẾM VÀ TƯ VẤN**:\n`;
                    productContext += `Khách hàng đang hỏi một câu chung chung hoặc tìm kiếm tự do. Hãy tự suy luận ngữ nghĩa dựa trên câu hỏi của khách hàng để chọn ra các sản phẩm phù hợp nhất từ danh sách dưới đây để giới thiệu (ví dụ: khách hỏi 'công nghệ' thì lọc đồ điện tử, khách hỏi 'đồ nữ' thì lọc mỹ phẩm, thời trang). Nếu không có cái nào khớp thì cứ nói rõ.\n\n`;
                    allProducts.slice(0, 30).forEach((product, index) => {
                        productContext += `${index + 1}. ${product.name} - ${product.price}`;
                        if (product.discount > 0) productContext += ` (${product.discount}%)`;
                        productContext += `\n`;
                        productContext += `   📂 Danh mục: ${product.category}\n`;
                        productContext += `   📝 Mô tả: ${product.description}\n\n`;
                    });
                }
            }
        }
    } catch (error) {
        console.error('❌ Error getting product context:', error);
        productContext = `\n\n⚠️ **Có lỗi xảy ra.** Vui lòng thử lại sau!`;
    }

    return {
        productContext,
        paginationData,
        searchResults,
        allProducts
    };
}

// ===== CHATBOT RESPONSE =====

/**
 * ✅ Get AI response from Gemini API
 */
async function getChatbotResponse(
    customerQuestion,
    context = '',
    conversationHistory = [],
    products = [],
    productContext = '',
    userId = 'default',
    session = { currentPage: 1 },
    history = []
) {
    try {
        // ✅ Rate limit check
        if (!checkRateLimit(userId)) {
            return {
                response: '⏸️ Bạn gửi quá nhiều tin nhắn. Vui lòng chờ một chút rồi thử lại!',
                updatedHistory: conversationHistory
            };
        }

        if (!customerQuestion || typeof customerQuestion !== 'string') {
            return {
                response: 'Vui lòng nhập một câu hỏi hợp lệ',
                updatedHistory: conversationHistory
            };
        }

        if (!API_KEY) {
            return {
                response: 'Lỗi: GOOGLE_API_KEY không được cấu hình trong .env',
                updatedHistory: conversationHistory
            };
        }

        // ✅ Detect question type & Get product context
        const questionType = detectQuestionType(customerQuestion);
        const { productContext: dynamicContext } = await getProductContext(
            questionType,
            session,
            history,
            customerQuestion
        );

        const finalProductContext = dynamicContext || productContext;

        const systemPrompt = `You are a professional and friendly customer support assistant for an e-commerce product management store.

Your role is to:
- Answer customer questions clearly and helpfully
- Be polite and professional
- Provide accurate information about products and services
- Suggest solutions to problems
- Respond in Vietnamese if asked in Vietnamese
- Remember previous conversation context
- Use ONLY the product information provided
- Do NOT create or make up product information
- Format product responses clearly with name, price, description
- When showing products, ALWAYS include: name, price, discount (if any), and stock status
- LƯU Ý QUAN TRỌNG: Nếu khách hàng yêu cầu tư vấn sản phẩm, hoặc hỏi sản phẩm nào "tốt nhất", bạn BẮT BUỘC phải đưa ra lý do chi tiết tại sao bạn lại chọn/đề xuất sản phẩm đó (dựa trên tính năng, mô tả hoặc giá trị của nó).
- BẮT BUỘC phải trả lời trọn vẹn câu, không bao giờ được ngắt quãng giữa chừng. Hãy luôn kiểm tra lại câu trả lời trước khi kết thúc.
- If no matching products found, apologize and suggest alternatives
${context ? `\n\nAdditional context about our business:\n${context}` : ''}
${finalProductContext}`;

        console.log(`🤖 [${questionType.questionType}] Processing: "${customerQuestion.substring(0, 50)}..."`);

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        const contents = [
            {
                role: 'user',
                parts: [{ text: systemPrompt }]
            },
            {
                role: 'model',
                parts: [{ text: 'Hiểu rồi. Tôi sẽ sử dụng chỉ những thông tin sản phẩm được cung cấp để hỗ trợ bạn.' }]
            },
            ...conversationHistory.flatMap(msg => [
                {
                    role: msg.role,
                    parts: [{ text: msg.content }]
                }
            ]),
            {
                role: 'user',
                parts: [{ text: customerQuestion }]
            }
        ];

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API Error:', errorData);
            
            if (errorData.error?.message?.includes('quota') || errorData.error?.message?.includes('high demand')) {
                return {
                    response: 'Xin lỗi, hiện tại hệ thống AI đang quá tải (High Demand). Hãy đợi một chút nhé!',
                    updatedHistory: conversationHistory
                };
            }
            
            return {
                response: `Xin lỗi, tôi đang gặp lỗi kết nối: ${errorData.error?.message || 'Unknown error'}`,
                updatedHistory: conversationHistory
            };
        }

        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!result) {
            return {
                response: 'Xin lỗi, tôi không thể xử lý câu hỏi của bạn lúc này. Vui lòng thử lại!',
                updatedHistory: conversationHistory
            };
        }

        console.log('✅ Response generated successfully');

        const updatedHistory = [
            ...conversationHistory,
            { role: 'user', content: customerQuestion },
            { role: 'model', content: result }
        ];

        return {
            response: result,
            updatedHistory: updatedHistory
        };

    } catch (error) {
        console.error('❌ Chatbot Error:', error.message);
        return {
            response: 'Có lỗi xảy ra: ' + error.message,
            updatedHistory: conversationHistory
        };
    }
}

// ===== EXPORTS =====

module.exports = {
    getChatbotResponse,
    detectQuestionType,
    extractKeywords,
    getShopProductsPaginated,
    getAllShopProducts,
    searchProducts,
    getProductContext,
    checkRateLimit,
    SHOP_CONFIG
};