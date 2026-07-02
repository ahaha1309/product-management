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

        this.sessionId = this.generateSessionId();
        this.isLoading = false;
        
        this.isInitialLoad = true;
        this.renderedMsgIds = new Set();
        this.currentConversationState = 'BOT';

        // Khởi tạo banner trạng thái
        this.statusBanner = document.createElement('div');
        this.statusBanner.className = 'chat-status-banner hidden items-center justify-center gap-2 py-2 px-3 text-[11px] font-semibold bg-indigo-50 text-indigo-600 rounded-lg mx-3 mb-3 border border-indigo-100 shadow-sm transition-all';
        this.statusBanner.innerHTML = `<i class="bi bi-person-check-fill text-sm"></i> Bạn đang được hỗ trợ bởi Nhân viên chăm sóc khách hàng.`;
        this.messageContainer.parentNode.insertBefore(this.statusBanner, this.messageContainer);

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
        // Loại bỏ kết nối Socket.IO vì Vercel Serverless không hỗ trợ tốt
        // Thay bằng HTTP Polling để lấy lịch sử chat
        this.fetchChatHistory();
        this.pollingInterval = setInterval(() => this.fetchChatHistory(), 3000);
    }

    async fetchChatHistory() {
        if (!this.userId) return;
        try {
            const res = await fetch('/chat/history');
            const history = await res.json();
            
            if (history && history.length > 0) {
                if (this.isInitialLoad) {
                    // Lần đầu tải: Render toàn bộ lịch sử từ DB (bao gồm cả user và admin)
                    // Lưu ý: Không clear innerHTML hoàn toàn vì có thể AI vừa gửi tin nhắn chào hỏi
                    // Nhưng để tránh trùng lặp, ta sẽ chỉ append những tin nhắn chưa có trong renderedMsgIds
                    // Thực tế là lúc này DOM có thể trống hoặc chỉ có câu chào của AI
                    
                    history.forEach(msg => {
                        this.addMessage(msg.content, !msg.isAdmin, msg.isAdmin);
                        this.renderedMsgIds.add(msg._id);
                    });
                    
                    this.isInitialLoad = false;
                } else {
                    // Chạy ngầm (polling): Chỉ append tin nhắn MỚI từ Admin để tránh xóa mất tin nhắn của AI
                    let hasNewAdminMessage = false;
                    history.forEach(msg => {
                        if (!this.renderedMsgIds.has(msg._id)) {
                            // Chỉ thêm tin nhắn của Admin vào DOM để tránh bị lặp tin nhắn của User (do user gửi đã tự render rồi)
                            if (msg.isAdmin) {
                                this.addMessage(msg.content, false, true);
                                hasNewAdminMessage = true;
                            }
                            this.renderedMsgIds.add(msg._id);
                        }
                    });
                    
                    if (hasNewAdminMessage && !this.chatbotModal.classList.contains('active')) {
                        this.chatbotBtn.classList.add('pulse-danger');
                    }
                }
            }
        } catch (err) {
            console.log('Lỗi fetch lịch sử chat:', err);
        }
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

        // Nếu đã ở chế độ HUMAN, mọi tin nhắn đều chuyển thẳng tới Admin
        if (this.currentConversationState === 'HUMAN') {
            if (!this.userId) {
                this.addMessage('Vui lòng đăng nhập để liên hệ với Nhân viên.', false, true);
                this.isLoading = false;
                this.sendBtn.disabled = false;
                this.inputField.focus();
                return;
            }

            fetch('/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: question })
            }).catch(err => console.log('Lỗi gửi tin nhắn cho admin:', err));
            
            this.isLoading = false;
            this.sendBtn.disabled = false;
            this.inputField.focus();
            return;
        }

        // Luôn gửi cho AI xử lý trước
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

                if (data.state) {
                    this.updateState(data.state);
                }

                if (data.status === 'success') {
                    // Nếu BE trả về state HUMAN, AI đã bị block và gửi tin lên db chat. 
                    // Ta không cần in AI reply rỗng
                    if (data.state !== 'HUMAN' && data.response) {
                        const botReply = data.response;
                        this.addMessage(botReply, false, false);

                        // Kiểm tra AI có bất lực không
                        const failureKeywords = ['xin lỗi', 'không có thông tin', 'chưa hiểu', 'không thể giúp', 'không tìm thấy', 'lỗi'];
                        const humanKeywords = ['nhân viên', 'tư vấn viên', 'admin', 'người thật', 'hỗ trợ thật', 'không biết', 'gặp người'];
                        
                        const isAiFailing = failureKeywords.some(kw => botReply.toLowerCase().includes(kw));
                        const isRequestingHuman = humanKeywords.some(kw => question.toLowerCase().includes(kw));

                        if ((isAiFailing || isRequestingHuman) && this.userId) {
                            if (isAiFailing && !isRequestingHuman) {
                                this.addMessage("Câu này tôi không thể giải thích rõ được, tôi đang chuyển câu hỏi của bạn cho nhân viên hỗ trợ nhé...", false, false);
                            } else {
                                this.addMessage("Tôi đang kết nối bạn với Nhân viên chăm sóc khách hàng. Xin vui lòng đợi trong giây lát...", false, false);
                            }
                            
                            // Gửi câu hỏi lên Admin Chat model
                            fetch('/chat/send', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ content: question })
                            }).catch(err => console.log('Lỗi gửi tin nhắn cho admin:', err));
                            
                            this.updateState('HUMAN');
                        }
                    } else if (data.state === 'HUMAN') {
                        // Backend đã tự động chuyển sang HUMAN từ một request trước đó, hoặc vừa chuyển
                        this.addMessage("Đang chờ phản hồi từ Nhân viên...", false, true);
                    }
                } else {
                    this.addMessage(`❌ Lỗi: ${data.message}`, false, false);
                    if (this.userId && this.currentConversationState !== 'HUMAN') {
                        this.addMessage("Đang kết nối bạn với Quản trị viên...", false, false);
                        fetch('/chat/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ content: question })
                        }).catch(err => console.log('Lỗi gửi tin nhắn cho admin:', err));
                        this.updateState('HUMAN');
                    }
                }
            } catch (error) {
                this.addMessage('❌ Có lỗi xảy ra khi kết nối tới Trợ lý AI. Vui lòng đợi...', false, false);
                if (this.userId && this.currentConversationState !== 'HUMAN') {
                    this.addMessage("Đang kết nối bạn với Quản trị viên...", false, false);
                    fetch('/chat/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: question })
                    }).catch(err => console.log('Lỗi gửi tin nhắn cho admin:', err));
                    this.updateState('HUMAN');
                }
            } finally {
                this.isLoading = false;
                this.sendBtn.disabled = false;
                this.inputField.focus();
            }
    }

    updateState(state) {
        if (this.currentConversationState !== state) {
            this.currentConversationState = state;
            if (state === 'HUMAN') {
                this.statusBanner.classList.remove('hidden');
                this.statusBanner.classList.add('flex');
            } else {
                this.statusBanner.classList.add('hidden');
                this.statusBanner.classList.remove('flex');
            }
        }
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