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
      const badge = item.querySelector('.new-msg-badge');
      if (badge) badge.remove();
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

      // Yêu cầu load lịch sử (HTTP Fetch thay vì Socket)
      fetch(`/admin/chat/history/${userId}`)
        .then(res => res.json())
        .then(history => {
          chatMessagesContainer.innerHTML = ''; // Xóa loading
          if (history.length === 0) {
            chatMessagesContainer.innerHTML = '<div class="text-center text-muted">Chưa có tin nhắn nào.</div>';
          } else {
            history.forEach(message => {
              renderMessage(message);
            });
          }
        })
        .catch(err => {
          chatMessagesContainer.innerHTML = '<div class="text-center text-danger">Lỗi tải tin nhắn.</div>';
        });

      chatInput.focus();
    });
  });

  // Thay thế SERVER_RETURN_HISTORY và SERVER_RETURN_MESSAGE bằng Polling
  setInterval(() => {
    const targetUserId = currentChatUserId.value;
    if (targetUserId) {
      fetch(`/admin/chat/history/${targetUserId}`)
        .then(res => res.json())
        .then(history => {
          // Lấy tin nhắn cuối cùng để so sánh (tránh render lại toàn bộ nếu không cần thiết)
          // Để đơn giản, render lại toàn bộ nhưng giữ thanh cuộn nếu đang ở dưới cùng
          const isAtBottom = chatMessagesContainer.scrollHeight - chatMessagesContainer.scrollTop <= chatMessagesContainer.clientHeight + 10;
          
          chatMessagesContainer.innerHTML = '';
          if (history.length === 0) {
            chatMessagesContainer.innerHTML = '<div class="text-center text-muted">Chưa có tin nhắn nào.</div>';
          } else {
            history.forEach(message => {
              renderMessage(message);
            });
          }
          
          if (isAtBottom) {
             scrollToBottom();
          }
        })
        .catch(err => console.log('Polling error:', err));
    }
  }, 3000); // Polling mỗi 3 giây

  // Gửi tin nhắn
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const content = chatInput.value.trim();
    const targetUserId = currentChatUserId.value;

    if (content && targetUserId) {
      // Dùng HTTP POST thay cho Socket
      fetch('/admin/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: targetUserId,
          content: content
        })
      })
      .then(res => res.json())
      .then(data => {
        // Tự render tin nhắn của mình luôn cho nhanh
        const emptyMsg = chatMessagesContainer.querySelector('.text-center');
        if (emptyMsg) emptyMsg.remove();
        renderMessage(data);
      })
      .catch(err => console.log('Lỗi gửi tin nhắn', err));

      chatInput.value = '';
    }
  });
});
