class ChatbotClient {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.chatMode = 'ai'; // 'ai' or 'human'
        
        this.chatbotBtn = document.getElementById('chatbotBtn');
        this.chatbotModal = document.getElementById('chatbotModal');
        this.closeChatbot = document.getElementById('closeChatbot');
        this.messageContainer = document.getElementById('chatbotMessages');
        this.inputField = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        
        const userIdInput = document.getElementById('chat-userid');
        this.userId = userIdInput ? userIdInput.value : null;

        this.isLoading = false;

        if (this.chatbotBtn && this.chatbotModal) {
            this.setupSocket();
            this.setupEventListeners();
            console.log('✅ Unified Chatbot initialized in AI mode');
        }
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    setupSocket() {
        if (!this.userId) return;
        this.socket = io({
            reconnectionAttempts: 2,
            timeout: 2000
        });

        // Lắng nghe tin nhắn từ Admin
        this.socket.on('SERVER_RETURN_MESSAGE', (data) => {
            if (data.userId === this.userId) {
                // Nếu nhận được tin nhắn từ Admin, tự động chốt cứng mode human
                if (data.isAdmin) {
                    this.chatMode = 'human';
                    this.addMessage(data.content, false, true); // true = isAdmin
                    
                    // Hiện bong bóng nếu đang tắt
                    if (!this.chatbotModal.classList.contains('active')) {
                        this.chatbotBtn.classList.add('pulse-danger');
                    }
                }
            }
        });

        // Lắng nghe lịch sử chat human
        this.socket.on('SERVER_RETURN_HISTORY', (history) => {
            if (history && history.length > 0) {
                // Nếu có lịch sử chat với human, tự động chuyển sang mode human luôn (để họ chat tiếp)
                // Tuy nhiên, ta có thể ưu tiên AI hỏi lại. 
                // Ở đây ta ưu tiên AI, lịch sử human chỉ load khi chuyển qua human mode.
            }
        });
    }

    setupEventListeners() {
        this.chatbotBtn.addEventListener('click', () => {
            this.chatbotModal.classList.add('active');
            this.chatbotBtn.classList.remove('pulse-danger');
            this.inputField.focus();
            
            // Xóa thông báo mới
            const badge = this.chatbotBtn.querySelector('.badge-dot');
            if (badge) badge.style.display = 'none';
        });

        this.closeChatbot.addEventListener('click', () => {
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
    }

    async sendMessage() {
        const question = this.inputField.value.trim();

        if (!question || this.isLoading) {
            return;
        }

        this.isLoading = true;
        this.sendBtn.disabled = true;

        this.addMessage(question, true);
        this.inputField.value = '';

        // Kiểm tra xem khách hàng có chủ động đòi gặp người thật không
        const humanKeywords = ['nhân viên', 'tư vấn viên', 'admin', 'người thật', 'hỗ trợ thật', 'không biết', 'gặp người'];
        const isRequestingHuman = humanKeywords.some(kw => question.toLowerCase().includes(kw));

        if (isRequestingHuman && this.chatMode === 'ai') {
            this.switchToHumanMode("Tôi đang kết nối bạn với Nhân viên chăm sóc khách hàng. Xin vui lòng đợi trong giây lát...");
            
            // Gửi luôn câu hỏi hiện tại cho admin
            if (this.userId && this.socket) {
                this.socket.emit('CLIENT_SEND_MESSAGE', {
                    userId: this.userId,
                    content: question,
                    isAdmin: false
                });
            }
            this.isLoading = false;
            this.sendBtn.disabled = false;
            this.inputField.focus();
            return;
        }

        // --- XỬ LÝ THEO MODE ---
        if (this.chatMode === 'human') {
            if (!this.userId) {
                this.addMessage('Vui lòng đăng nhập để liên hệ với Nhân viên.', false, true);
                this.isLoading = false;
                this.sendBtn.disabled = false;
                return;
            }

            // Gửi qua Socket cho Admin
            this.socket.emit('CLIENT_SEND_MESSAGE', {
                userId: this.userId,
                content: question,
                isAdmin: false
            });

            this.isLoading = false;
            this.sendBtn.disabled = false;
            this.inputField.focus();

        } else {
            // Gửi cho AI
            try {
                const response = await fetch('/chatbot/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question: question,
                        context: '',
                        sessionId: this.sessionId
                    })
                });

                const data = await response.json();

                if (data.status === 'success') {
                    const botReply = data.response;
                    this.addMessage(botReply, false, false);

                    // Kiểm tra AI có bất lực không
                    const failureKeywords = ['xin lỗi', 'không có thông tin', 'chưa hiểu', 'không thể giúp', 'không tìm thấy', 'lỗi'];
                    const isAiFailing = failureKeywords.some(kw => botReply.toLowerCase().includes(kw));

                    if (isAiFailing && this.userId) {
                        this.switchToHumanMode("Hệ thống tự động đang gặp chút khó khăn. Tôi đang chuyển bạn tới Quản trị viên để được hỗ trợ tốt nhất...");
                        if (this.socket) {
                            this.socket.emit('CLIENT_SEND_MESSAGE', {
                                userId: this.userId,
                                content: question,
                                isAdmin: false
                            });
                        }
                    }
                } else {
                    this.addMessage(`❌ Lỗi: ${data.message}`, false, false);
                    if (this.userId) {
                        this.switchToHumanMode("Đang kết nối bạn với Quản trị viên...");
                        if (this.socket) {
                            this.socket.emit('CLIENT_SEND_MESSAGE', {
                                userId: this.userId,
                                content: question,
                                isAdmin: false
                            });
                        }
                    }
                }
            } catch (error) {
                this.addMessage('❌ Có lỗi xảy ra khi kết nối tới Trợ lý AI. Vui lòng đợi...', false, false);
                if (this.userId) {
                    this.switchToHumanMode("Đang kết nối bạn với Quản trị viên...");
                    if (this.socket) {
                        this.socket.emit('CLIENT_SEND_MESSAGE', {
                            userId: this.userId,
                            content: question,
                            isAdmin: false
                        });
                    }
                }
            } finally {
                this.isLoading = false;
                this.sendBtn.disabled = false;
                this.inputField.focus();
            }
        }
    }

    switchToHumanMode(reasonMessage) {
        this.chatMode = 'human';
        setTimeout(() => {
            this.addMessage(reasonMessage, false, true);
            
            // Lấy lịch sử chat cũ với admin
            if (this.socket && this.userId) {
                this.socket.emit('CLIENT_FETCH_HISTORY', { userId: this.userId });
            }
        }, 1000);
    }

    formatMessage(text) {
        if (!text) return '';
        let formatted = this.escapeHtml(text);
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/^### (.+)$/gm, '<h4 style="margin: 10px 0 5px 0; font-size: 14px; font-weight: 600;">$1</h4>');
        formatted = formatted.replace(/^## (.+)$/gm, '<h3 style="margin: 12px 0 8px 0; font-size: 15px; font-weight: 700;">$1</h3>');
        formatted = formatted.replace(/^\* (.+)$/gm, '<div style="margin-left: 15px; margin-bottom: 5px;">• $1</div>');
        formatted = formatted.replace(/^\d+\. (.+)$/gm, '<div style="margin-left: 15px; margin-bottom: 5px;">▪ $1</div>');
        formatted = formatted.replace(/\n/g, '<br>');
        return formatted;
    }

    addMessage(text, isUser, isAdmin = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = isUser ? 'chat-message user-message' : 'chat-message bot-message';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (isUser) {
            contentDiv.innerHTML = `<p>${this.escapeHtml(text)}</p>`;
        } else {
            // Đóng dấu người trả lời (AI hay Human)
            let authorLabel = '';
            if (isAdmin) {
                authorLabel = `<div style="font-size: 11px; font-weight: bold; color: #ff4757; margin-bottom: 4px;">🧑‍💻 Quản trị viên</div>`;
                messageDiv.classList.add('admin-message'); // css rieng
            } else {
                authorLabel = `<div style="font-size: 11px; font-weight: bold; color: #667eea; margin-bottom: 4px;">🤖 Trợ lý AI</div>`;
            }

            contentDiv.innerHTML = authorLabel + `<div>${this.formatMessage(text)}</div>`;
        }

        messageDiv.appendChild(contentDiv);
        this.messageContainer.appendChild(messageDiv);

        setTimeout(() => {
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        }, 100);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Phương thức mở chat từ ngoài (VD: Nút Chat Ngay)
    openAndPrefill(text) {
        this.chatbotModal.classList.add('active');
        this.inputField.value = text;
        this.inputField.focus();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new ChatbotClient();
});

// Ghi đè hàm openProductChat ở trang chi tiết sản phẩm
window.openProductChat = function(productTitle) {
    if (window.chatbot) {
        window.chatbot.openAndPrefill('Tôi cần tư vấn về sản phẩm: ' + productTitle);
    } else {
        alert('Chatbot chưa sẵn sàng!');
    }
};