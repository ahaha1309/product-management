const express = require('express');
const router = express.Router();
const {
  getChatbotResponse,
  detectQuestionType,
  getProductContext,
} = require('../../helper/chatbot');

// ✅ Lưu conversation history + pagination state
const conversationSessions = {};

/**
 * POST /api/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const { question, context, sessionId } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Question is required and must be a string',
      });
    }

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return res.status(400).json({
        status: 'error',
        message: 'Question cannot be empty',
      });
    }

    console.log('📨 Chat request received:', trimmedQuestion);
    console.log('💾 Session ID:', sessionId);

    // ✅ Get or create session
    if (!conversationSessions[sessionId]) {
      conversationSessions[sessionId] = {
        history: [],
        currentPage: 1,
        totalProducts: 0,
      };
    }

    const session = conversationSessions[sessionId];
    const history = session.history;

    // ✅ Detect question type
    const questionType = detectQuestionType(trimmedQuestion);
    console.log(`🔍 Question type: ${questionType.type}`);

    // ✅ Get product context dựa trên question type
    const { productContext, paginationData, allProducts } = await getProductContext(
      questionType,
      session,
      history
    );

    const { response, updatedHistory } = await getChatbotResponse(
      trimmedQuestion,
      context || '',
      history,
      paginationData?.products || allProducts,
      productContext
    );

    session.history = updatedHistory;

    res.json({
      status: 'success',
      question: trimmedQuestion,
      response: response,
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
      messageCount: updatedHistory.length,
      questionType: questionType.type,
      productsUsed: paginationData?.products.length || allProducts.length,
      pagination: paginationData
        ? {
            currentPage: paginationData.currentPage,
            totalPages: paginationData.totalPages,
            totalProducts: paginationData.totalProducts,
            productsPerPage: 5,
          }
        : null,
    });
  } catch (error) {
    console.error('❌ Chat Router Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/chat/history/:sessionId
 */
router.get('/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = conversationSessions[sessionId];
  const history = session ? session.history : [];

  res.json({
    status: 'success',
    sessionId: sessionId,
    history: history,
    messageCount: history.length,
  });
});

/**
 * DELETE /api/chat/history/:sessionId
 */
router.delete('/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  if (conversationSessions[sessionId]) {
    delete conversationSessions[sessionId];
  }

  res.json({
    status: 'success',
    message: 'Conversation history cleared',
    sessionId: sessionId,
  });
});

module.exports = router;
