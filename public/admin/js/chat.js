document.addEventListener('DOMContentLoaded', () => {
  const socket = io({
      reconnectionAttempts: 2,
      timeout: 2000
  });

  const userItems = document.querySelectorAll('.chat-user-item');
  const chatWindow = document.getElementById('admin-chat-window');
  const currentChatName = document.getElementById('current-chat-name');
  const currentChatUserId = document.getElementById('current-chat-userid');
  const chatMessagesContainer = document.getElementById('admin-chat-messages');
  const chatForm = document.getElementById('admin-chat-form');
  const chatInput = document.getElementById('admin-chat-input');

  // Hàm cuộn xuống dưới cùng
  const scrollToBottom = () => {
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  };

  // Hàm vẽ tin nhắn ra màn hình
  const renderMessage = (message) => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message');
    
    // Nếu là admin gửi thì class là self, ngược lại là client
    if (message.isAdmin) {
      messageDiv.classList.add('self');
    } else {
      messageDiv.classList.add('client');
    }

    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    bubble.textContent = message.content;

    messageDiv.appendChild(bubble);
    chatMessagesContainer.appendChild(messageDiv);
    scrollToBottom();
  };

  // Khi click vào một khách hàng
  userItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Xóa active cũ
      userItems.forEach(u => u.classList.remove('active'));
      item.classList.add('active');

      const userId = item.getAttribute('data-userid');
      const fullName = item.getAttribute('data-fullname');

      // Cập nhật giao diện
      currentChatName.textContent = `Đang chat với ${fullName}`;
      currentChatUserId.value = userId;
      chatWindow.classList.remove('d-none');
      
      // Clear tin nhắn cũ và show loading
      chatMessagesContainer.innerHTML = '<div class="text-center text-muted">Đang tải tin nhắn...</div>';

      // Yêu cầu load lịch sử
      socket.emit('CLIENT_FETCH_HISTORY', { userId: userId });
      chatInput.focus();
    });
  });

  // Nhận lịch sử chat từ server
  socket.on('SERVER_RETURN_HISTORY', (history) => {
    // Chỉ render nếu history thuộc về user đang chọn
    if (history.length > 0 && history[0].userId !== currentChatUserId.value && currentChatUserId.value) {
      // Có thể nhận nhầm nếu click nhanh 2 lần, nhưng logic backend lấy theo id truyền lên nên thường đúng
    }
    chatMessagesContainer.innerHTML = ''; // Xóa loading
    
    if (history.length === 0) {
      chatMessagesContainer.innerHTML = '<div class="text-center text-muted">Chưa có tin nhắn nào.</div>';
    } else {
      history.forEach(message => {
        renderMessage(message);
      });
    }
  });

  // Nhận tin nhắn mới
  socket.on('SERVER_RETURN_MESSAGE', (data) => {
    // Nếu tin nhắn mới thuộc về user đang mở khung chat
    if (data.userId === currentChatUserId.value) {
      // Nếu message container đang hiện "Chưa có tin nhắn nào", xóa nó đi
      const emptyMsg = chatMessagesContainer.querySelector('.text-center');
      if (emptyMsg) emptyMsg.remove();
      
      renderMessage(data);
    }
    
    // Nâng cao: Nếu có tin nhắn từ user khác, hiện badge đỏ ở danh sách user (bỏ qua nếu phức tạp)
    // Nếu tin nhắn từ client gửi đến mà họ chưa có trong danh sách, ta có thể phải tải lại trang hoặc prepend DOM
  });

  // Gửi tin nhắn
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const content = chatInput.value.trim();
    const targetUserId = currentChatUserId.value;

    if (content && targetUserId) {
      socket.emit('CLIENT_SEND_MESSAGE', {
        userId: targetUserId,
        content: content,
        isAdmin: true // Quan trọng: đánh dấu là admin gửi
      });
      chatInput.value = '';
    }
  });
});
