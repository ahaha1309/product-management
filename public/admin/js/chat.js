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
    // 1. Render tin nhắn nếu đang mở đúng khung chat
    if (data.userId === currentChatUserId.value) {
      const emptyMsg = chatMessagesContainer.querySelector('.text-center');
      if (emptyMsg) emptyMsg.remove();
      renderMessage(data);
    }
    
    // 2. Cập nhật Sidebar (nếu tin nhắn từ Client gửi)
    if (!data.isAdmin) {
      const userList = document.getElementById('chat-user-list');
      let userItem = userList.querySelector(`.chat-user-item[data-userid="${data.userId}"]`);
      
      if (userItem) {
        // Có sẵn trong danh sách -> Đưa lên đầu
        userList.prepend(userItem);
        // Nháy nền nhẹ
        userItem.style.transition = 'background-color 0.3s';
        userItem.style.backgroundColor = '#ecfdf5'; // brand-50
        setTimeout(() => userItem.style.backgroundColor = '', 2000);
        
        // Hiện chấm đỏ nếu đang không mở đúng chat này
        if (data.userId !== currentChatUserId.value) {
          let badge = userItem.querySelector('.new-msg-badge');
          if (!badge) {
             const flexContainer = userItem.querySelector('.flex.items-center');
             if(flexContainer) {
                 badge = document.createElement('span');
                 badge.className = 'new-msg-badge w-3 h-3 bg-red-500 rounded-full inline-block ml-auto';
                 flexContainer.appendChild(badge);
             }
          }
        }
      } else {
        // Chưa có trong danh sách -> reload trang cho an toàn và nhanh nhất vì thiếu avatar/fullname
        if (!currentChatUserId.value) {
           window.location.reload();
        } else {
           // Nếu đang chat dở mà có người mới tinh, tạm thời thêm một ô "Khách hàng mới"
           const newItem = document.createElement('a');
           newItem.href = "#";
           newItem.className = "chat-user-item block p-4 hover:bg-brand-50 transition-colors focus:bg-brand-50";
           newItem.setAttribute("data-userid", data.userId);
           newItem.setAttribute("data-fullname", "Khách hàng mới");
           newItem.innerHTML = `
             <div class="flex items-center gap-3">
               <div class="w-10 h-10 rounded-full bg-surface-200 flex items-center justify-center shrink-0">
                  <i class="bi bi-person text-surface-500"></i>
               </div>
               <div class="min-w-0 flex-1">
                 <div class="font-semibold text-surface-900 truncate">Khách hàng mới</div>
                 <div class="text-xs text-surface-500 truncate mt-0.5">Vừa gửi tin nhắn</div>
               </div>
               <span class="new-msg-badge w-3 h-3 bg-red-500 rounded-full inline-block ml-auto"></span>
             </div>
           `;
           
           newItem.addEventListener('click', (e) => {
              e.preventDefault();
              window.location.href = window.location.pathname; // Tải lại trang để lấy data chuẩn
           });
           
           userList.prepend(newItem);
           const noMsg = userList.querySelector('.text-center.text-surface-500');
           if (noMsg) noMsg.remove();
        }
      }
    }
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
