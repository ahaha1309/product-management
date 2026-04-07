class ChatbotClient {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.conversationHistory = [];
        
        this.chatbotBtn = document.getElementById('chatbotBtn');
        this.chatbotModal = document.getElementById('chatbotModal');
        this.closeChatbot = document.getElementById('closeChatbot');
        this.messageContainer = document.getElementById('chatbotMessages');
        this.inputField = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        
        this.isLoading = false;

        if (this.chatbotBtn && this.chatbotModal) {
            this.setupEventListeners();
            console.log('✅ Chatbot initialized');
            console.log('📝 Session ID:', this.sessionId);
        } else {
            console.error('❌ Chatbot elements not found');
        }
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    setupEventListeners() {
        this.chatbotBtn.addEventListener('click', () => {
            console.log('🔓 Opening chatbot');
            this.chatbotModal.classList.add('active');
            this.inputField.focus();
        });

        this.closeChatbot.addEventListener('click', () => {
            console.log('🔒 Closing chatbot');
            this.chatbotModal.classList.remove('active');
        });

        this.sendBtn.addEventListener('click', () => this.sendMessage());

        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isLoading) {
                this.sendMessage();
            }
        });

        this.chatbotModal.addEventListener('click', (e) => {
            if (e.target === this.chatbotModal) {
                this.chatbotModal.classList.remove('active');
            }
        });

        console.log('✅ Event listeners attached');
    }

    async sendMessage() {
        const question = this.inputField.value.trim();

        if (!question || this.isLoading) {
            console.warn('⚠️ Empty question or already loading');
            return;
        }

        this.isLoading = true;
        this.sendBtn.disabled = true;

        console.log('📨 Sending message:', question);

        this.addMessage(question, true);
        this.inputField.value = '';

        try {
            const response = await fetch('/chatbot/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: question,
                    context: '',
                    sessionId: this.sessionId
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                console.log('✅ Response received');
                
                // ✅ Hiển thị response với format đẹp
                this.addMessage(data.response, false);
                
                console.log(`📝 Messages in conversation: ${data.messageCount}`);
            } else {
                console.error('❌ API Error:', data.message);
                this.addMessage(`❌ Lỗi: ${data.message}`, false);
            }
        } catch (error) {
            console.error('❌ Network Error:', error);
            this.addMessage('❌ Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại!', false);
        } finally {
            this.isLoading = false;
            this.sendBtn.disabled = false;
            this.inputField.focus();
        }
    }

    /**
     * ✅ Format text với Markdown + HTML
     */
    formatMessage(text) {
        if (!text) return '';

        // ✅ Escape HTML trước
        let formatted = this.escapeHtml(text);

        // ✅ Convert Markdown-style bold (**text**)
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // ✅ Convert Markdown-style italic (*text*)
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // ✅ Convert headers (### text -> <h4>text</h4>)
        formatted = formatted.replace(/^### (.+)$/gm, '<h4 style="margin: 10px 0 5px 0; font-size: 14px; font-weight: 600;">$1</h4>');
        formatted = formatted.replace(/^## (.+)$/gm, '<h3 style="margin: 12px 0 8px 0; font-size: 15px; font-weight: 700;">$1</h3>');

        // ✅ Convert bullet points (* item -> • item)
        formatted = formatted.replace(/^\* (.+)$/gm, '<div style="margin-left: 15px; margin-bottom: 5px;">• $1</div>');

        // ✅ Convert numbered lists (1. item)
        formatted = formatted.replace(/^\d+\. (.+)$/gm, '<div style="margin-left: 15px; margin-bottom: 5px;">▪ $1</div>');

        // ✅ Convert line breaks
        formatted = formatted.replace(/\n/g, '<br>');

        // ✅ Format product prices (Giá: 899đ)
        formatted = formatted.replace(/Giá:\s*(\d+[đ\$%A-Za-z]*)/gi, '<span style="color: #d63031; font-weight: 600;">Giá: $1</span>');

        // ✅ Format categories (Danh mục: Electronics)
        formatted = formatted.replace(/Danh mục:\s*(.+?)(<br>|<\/div>|$)/gi, '<span style="color: #0984e3; background: #f0f3f4; padding: 2px 6px; border-radius: 3px;">Danh mục: $1</span>$2');

        // ✅ Format mô tả
        formatted = formatted.replace(/Mô tả:\s*(.+?)(<br>|<\/div>|$)/gi, '<div style="margin: 8px 0; line-height: 1.6;">Mô tả: $1</div>$2');

        // ✅ Format discount (Giảm giá: 15%)
        formatted = formatted.replace(/Giảm giá:\s*(\d+%)/gi, '<span style="color: #e74c3c; font-weight: 600;">🎉 Giảm giá: $1</span>');

        return formatted;
    }

    addMessage(text, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.className = isUser ? 'chat-message user-message' : 'chat-message bot-message';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (isUser) {
            // ✅ User message - giữ nguyên text
            contentDiv.innerHTML = `<p>${this.escapeHtml(text)}</p>`;
        } else {
            // ✅ Bot message - format text
            contentDiv.innerHTML = `<div>${this.formatMessage(text)}</div>`;
        }

        messageDiv.appendChild(contentDiv);
        this.messageContainer.appendChild(messageDiv);

        console.log(`💬 ${isUser ? 'User' : 'Bot'}: ${text.substring(0, 50)}...`);

        // ✅ Auto scroll xuống cuối
        setTimeout(() => {
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        }, 100);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async getHistory() {
        try {
            const response = await fetch(`/chatbot/chat/history/${this.sessionId}`);
            const data = await response.json();
            console.log('📚 Conversation History:', data.history);
            return data.history;
        } catch (error) {
            console.error('❌ Error getting history:', error);
        }
    }

    async clearHistory() {
        try {
            const response = await fetch(`/chatbot/chat/history/${this.sessionId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            console.log('🗑️ History cleared');
            this.messageContainer.innerHTML = `
                <div class="chat-message bot-message">
                    <div class="message-content">
                        <p>Xin chào! 👋 Tôi là trợ lý AI. Tôi có thể giúp bạn với bất kỳ câu hỏi nào về sản phẩm. Hãy nhập câu hỏi của bạn!</p>
                    </div>
                </div>
            `;
            return data;
        } catch (error) {
            console.error('❌ Error clearing history:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new ChatbotClient();
});