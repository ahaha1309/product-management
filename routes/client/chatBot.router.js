const express = require('express');
const router = express.Router();
const {
  getChatbotResponse,
  detectQuestionType,
  getProductContext,
} = require('../../helper/chatbot');
const Conversation = require('../../models/conversation.model');
const Chat = require('../../models/chat.model');

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

    // --- NEW: ENTERPRISE CONVERSATION STATE MANAGEMENT ---
    let conversation = null;
    let userId = res.locals.user ? res.locals.user._id.toString() : sessionId; // Fallback to sessionId for guests

    if (userId) {
      conversation = await Conversation.findOne({ userId });
      if (!conversation) {
        conversation = await Conversation.create({
          userId,
          status: 'BOT',
          auditLogs: [{ action: 'CREATED', performedBy: 'SYSTEM' }]
        });
      }

      // EARLY STOP EXECUTION: Prevent AI if status is HUMAN or CLOSED
      if (conversation.status !== 'BOT') {
        console.log(`🔒 Chat locked by status: ${conversation.status}. Bypassing AI.`);
        
        // Save the user's message to the Chat DB for the Admin
        if (res.locals.user) {
          await Chat.create({
            userId: userId,
            content: trimmedQuestion,
            isAdmin: false
          });
        }
        
        return res.json({
          status: 'success',
          question: trimmedQuestion,
          response: '', // AI stays completely silent
          state: conversation.status,
          messageCount: history.length,
          timestamp: new Date().toISOString()
        });
      }
    }
    // -----------------------------------------------------

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
      productContext,
      sessionId
    );

    // --- NEW: AUTOMATIC TRANSFER (FALLBACK / HUMAN REQUEST) ---
    const failureKeywords = ['xin lỗi', 'không có thông tin', 'chưa hiểu', 'không thể giúp', 'không tìm thấy', 'lỗi'];
    const humanKeywords = ['nhân viên', 'tư vấn viên', 'admin', 'người thật', 'hỗ trợ thật', 'không biết', 'gặp người'];
    
    const isAiFailing = failureKeywords.some(kw => response.toLowerCase().includes(kw));
    const isRequestingHuman = humanKeywords.some(kw => trimmedQuestion.toLowerCase().includes(kw));

    if ((isAiFailing || isRequestingHuman) && conversation && conversation.status === 'BOT') {
      const transferReason = isRequestingHuman ? 'HUMAN_REQUEST' : 'FALLBACK';
      await Conversation.updateOne(
        { _id: conversation._id },
        { 
          $set: { 
            status: 'HUMAN',
            transferredBy: 'SYSTEM',
            transferReason: transferReason
          },
          $push: {
            auditLogs: {
              action: 'TRANSFERRED',
              performedBy: 'SYSTEM',
              reason: transferReason
            }
          }
        }
      );
      console.log(`🔄 Handoff triggered: ${transferReason}`);
    }
    // -----------------------------------------------------

    session.history = updatedHistory;

    res.json({
      status: 'success',
      question: trimmedQuestion,
      response: response,
      state: (conversation && conversation.status !== 'BOT') ? 'HUMAN' : 'BOT',
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
