require('dotenv').config();
const Product = require('../models/product.model');
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error('❌ GOOGLE_API_KEY is not set in .env file');
}

/**
 * Get AI response from Gemini API - with conversation history & product context
 */
async function getChatbotResponse(
  customerQuestion,
  context = '',
  conversationHistory = [],
  products = [],
  productContext = ''
) {
  try {
    if (!customerQuestion || typeof customerQuestion !== 'string') {
      return {
        response: 'Vui lòng nhập một câu hỏi hợp lệ',
        updatedHistory: conversationHistory,
      };
    }

    if (!API_KEY) {
      return {
        response: 'Lỗi: GOOGLE_API_KEY không được cấu hình trong .env',
        updatedHistory: conversationHistory,
      };
    }

    const systemPrompt = `You are a professional and friendly customer support assistant for an e-commerce product management store.

Your role is to:
- Answer customer questions clearly and helpfully
- Be polite and professional
- Provide accurate information about products and services
- Suggest solutions to problems
- Respond in Vietnamese if asked in Vietnamese
- Remember previous conversation context
- Use ONLY the product information provided to answer questions about available items
- Do NOT create or make up product information
- Format product responses clearly with name, price, description
${context ? `\n\nAdditional context about our business:\n${context}` : ''}
${productContext}`;

    console.log('🤖 Generating response for question:', customerQuestion);
    console.log('📝 Conversation history length:', conversationHistory.length);
    console.log('📦 Products available:', products.length);

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [
          { text: 'Understood. I will assist you using only the provided product information.' },
        ],
      },
      ...conversationHistory.flatMap((msg) => [
        {
          role: msg.role,
          parts: [{ text: msg.content }],
        },
      ]),
      {
        role: 'user',
        parts: [{ text: customerQuestion }],
      },
    ];

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);
      return {
        response: `Lỗi API: ${errorData.error?.message || 'Unknown error'}`,
        updatedHistory: conversationHistory,
      };
    }

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) {
      console.warn('⚠️ No response generated');
      return {
        response: 'Xin lỗi, tôi không thể xử lý câu hỏi của bạn lúc này. Vui lòng thử lại!',
        updatedHistory: conversationHistory,
      };
    }

    console.log('✅ Response generated successfully');

    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: customerQuestion },
      { role: 'model', content: result },
    ];

    return {
      response: result,
      updatedHistory: updatedHistory,
    };
  } catch (error) {
    console.error('❌ Chatbot Error:', error.message);
    return {
      response: 'Có lỗi xảy ra: ' + error.message,
      updatedHistory: conversationHistory,
    };
  }
}
function detectQuestionType(question) {
  const lowerQuestion = question.toLowerCase();

  // ✅ Câu hỏi liệt kê sản phẩm (PAGINATION)
  const listingKeywords = [
    'giới thiệu',
    'xem sản phẩm',
    'danh sách',
    'có những gì',
    'bán những gì',
    'sản phẩm gì',
    'shop bán',
    'sản phẩm của shop',
    'sản phẩm nào',
    'tiếp theo',
    'sản phẩm khác',
    'trang sau',
    'page',
    'next',
  ];

  // ✅ Câu hỏi gợi ý/so sánh (QUERY ALL)
  const recommendKeywords = [
    'nên chọn',
    'tốt nhất',
    'gợi ý',
    'recommend',
    'nên mua',
    'nào tốt',
    'nào rẻ',
    'giá rẻ',
    'giá tốt',
    'so sánh',
    'khác nhau',
    'phù hợp',
    'phù hợp với',
    'cái nào tốt',
    'cái nào rẻ',
    'loại nào',
    'đặc điểm',
    'ưu điểm',
    'nhược điểm',
  ];

  // ✅ Câu hỏi chung chung (KHÔNG CẦN SẢN PHẨM)
  const generalKeywords = [
    'giờ mở cửa',
    'giờ hoạt động',
    'địa chỉ',
    'liên hệ',
    'điện thoại',
    'email',
    'chính sách',
    'trả góp',
    'giao hàng',
    'vận chuyển',
    'bảo hành',
    'đổi trả',
    'hoàn tiền',
    'miễn phí vận chuyển',
    'phí vận chuyển',
    'thời gian giao',
    'ship',
    'thanh toán',
    'hình thức thanh toán',
    'khuyến mại',
    'mã giảm giá',
    'voucher',
    'chương trình',
    'hỗ trợ',
    'giúp đỡ',
    'tư vấn',
  ];

  const isListing = listingKeywords.some((kw) => lowerQuestion.includes(kw));
  const isRecommend = recommendKeywords.some((kw) => lowerQuestion.includes(kw));
  const isGeneral = generalKeywords.some((kw) => lowerQuestion.includes(kw));

  return {
    type: isRecommend ? 'recommend' : isListing ? 'listing' : isGeneral ? 'general' : 'other',
    isListing,
    isRecommend,
    isGeneral,
  };
}

/**
 * Helper: Lấy sản phẩm theo trang (cho listing)
 */
async function getShopProductsPaginated(page = 1, limit = 5) {
  try {
    const skip = (page - 1) * limit;
    const total = await Product.countDocuments({ status: 'active' });

    const products = await Product.find({ status: 'active' })
      .select('title description price discountPercentage stock category thumbnail')
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedProducts = products.map((p) => ({
      name: p.title || p.name,
      price: `${p.price}đ`,
      description: p.description || 'No description',
      discount: p.discountPercentage || 0,
      category: p.category || 'Uncategorized',
      stock: p.stock || 0,
    }));

    return {
      products: formattedProducts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      limit: limit,
    };
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return {
      products: [],
      currentPage: page,
      totalPages: 0,
      totalProducts: 0,
      limit: limit,
    };
  }
}

/**
 * Helper: Lấy TẤT CẢ sản phẩm (cho recommend/compare)
 */
async function getAllShopProducts() {
  try {
    const products = await Product.find({ status: 'active' })
      .select('title description price discountPercentage stock category thumbnail')
      .lean();

    const formattedProducts = products.map((p) => ({
      name: p.title || p.name,
      price: `${p.price}đ`,
      description: p.description || 'No description',
      discount: p.discountPercentage || 0,
      category: p.category || 'Uncategorized',
      stock: p.stock || 0,
    }));

    return formattedProducts;
  } catch (error) {
    console.error('❌ Error fetching all products:', error);
    return [];
  }
}

/**
 * Helper: Lấy product context dựa trên question type
 */
async function getProductContext(questionType, session, history) {
  let productContext = '';
  let paginationData = null;
  let allProducts = [];

  if (questionType.type === 'listing') {
    // ✅ LISTING: Dùng pagination
    console.log('📄 MODE: Pagination (Listing)');

    const isNextPage = history.length > 0;
    let pageToShow = session.currentPage;

    if (isNextPage) {
      pageToShow = session.currentPage + 1;
    } else if (history.length === 0) {
      pageToShow = 1;
    }

    paginationData = await getShopProductsPaginated(pageToShow, 5);
    session.currentPage = pageToShow;
    session.totalProducts = paginationData.totalProducts;

    console.log(`📦 Page ${pageToShow}/${paginationData.totalPages}`);

    if (paginationData.products.length > 0) {
      productContext = `\n\n📦 **DANH SÁCH SẢN PHẨM (Trang ${pageToShow}/${paginationData.totalPages} - Tổng ${paginationData.totalProducts} sản phẩm)**:\n\n`;

      paginationData.products.forEach((product, index) => {
        const productNum = (pageToShow - 1) * 5 + index + 1;
        productContext += `${productNum}. **${product.name}**\n`;
        productContext += `   • Giá: ${product.price}\n`;
        productContext += `   • Danh mục: ${product.category}\n`;
        productContext += `   • Mô tả: ${product.description}\n`;
        if (product.discount > 0) {
          productContext += `   • Giảm giá: ${product.discount}%\n`;
        }
        if (product.stock > 0) {
          productContext += `   • Kho: ${product.stock} cái\n`;
        }
        productContext += '\n';
      });

      if (paginationData.totalPages > 1) {
        productContext += `\n⏭️ **Có ${paginationData.totalProducts} sản phẩm trong tổng số. `;
        if (pageToShow < paginationData.totalPages) {
          productContext += `Hãy hỏi "sản phẩm khác" hoặc "tiếp theo" để xem thêm.**`;
        } else {
          productContext += `Đây là sản phẩm cuối cùng.**`;
        }
      }
    }
  } else if (questionType.type === 'recommend') {
    // ✅ RECOMMEND: Lấy TẤT CẢ sản phẩm
    console.log('💡 MODE: Query All Products (Recommendation/Comparison)');

    allProducts = await getAllShopProducts();
    console.log(`📦 Retrieved ALL ${allProducts.length} products for recommendation`);

    if (allProducts.length > 0) {
      productContext = `\n\n📦 **TẤT CẢ SẢN PHẨM CỬA HÀNG (${allProducts.length} sản phẩm)**:\n\n`;

      allProducts.forEach((product, index) => {
        productContext += `${index + 1}. **${product.name}**\n`;
        productContext += `   • Giá: ${product.price}\n`;
        productContext += `   • Danh mục: ${product.category}\n`;
        productContext += `   • Mô tả: ${product.description}\n`;
        if (product.discount > 0) {
          productContext += `   • Giảm giá: ${product.discount}%\n`;
        }
        if (product.stock > 0) {
          productContext += `   • Kho: ${product.stock} cái\n`;
        }
        productContext += '\n';
      });

      productContext += `\n💡 **Dựa vào các sản phẩm trên, hãy đưa ra lời gợi ý phù hợp nhất cho người dùng.**`;
    }
  } else if (questionType.type === 'general') {
    // ✅ GENERAL: Không cần sản phẩm - trả lời chung chung
    console.log('❓ MODE: General Question (No Products Needed)');

    productContext = `\n\n📋 **THÔNG TIN CHUNG VỀ CỬA HÀNG**:
- Giờ hoạt động: 08:00 - 22:00 (Từ thứ Hai đến Chủ Nhật)
- Địa chỉ: Tp.Hà Nội
- Hotline: 0886911791
- Email: vanhanguyen2k4@gmail.com
- Chính sách giao hàng: Miễn phí giao hàng cho đơn hàng trên 500k
- Thời gian giao hàng: 1-2 ngày
- Chính sách đổi trả: 7 ngày đổi trả hoàn tiền 100%
- Bảo hành: Tùy theo sản phẩm (1-2 năm)
- Hình thức thanh toán: Thanh toán khi nhận hàng, Chuyển khoản, Ví điện tử`;
  } else {
    // ✅ OTHER: Câu hỏi không xác định - AI sẽ xử lý chung
    console.log('🤷 MODE: Other Question (AI will handle)');
    productContext = '';
  }

  return {
    productContext,
    paginationData,
    allProducts,
  };
}
console.log('✅ Chatbot helper initialized');

// ✅ EXPORT - CHỈ 1 LẦN
module.exports = {
  getChatbotResponse,
  detectQuestionType,
  getShopProductsPaginated,
  getAllShopProducts,
  getProductContext,
};
