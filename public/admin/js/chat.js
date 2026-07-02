document.addEventListener('DOMContentLoaded', () => {
  const userItems = document.querySelectorAll('.chat-user-item');
  const chatWindow = document.getElementById('admin-chat-window');
  const emptyState = document.getElementById('admin-chat-empty');
  const loadingState = document.getElementById('admin-chat-loading');
  const currentChatName = document.getElementById('current-chat-name');
  const currentChatStatus = document.getElementById('current-chat-status');
  const currentChatUserId = document.getElementById('current-chat-userid');
  const chatMessagesContainer = document.getElementById('admin-chat-messages');
  const chatForm = document.getElementById('admin-chat-form');
  const chatInput = document.getElementById('admin-chat-input');
  const btnSendMsg = document.getElementById('btn-send-msg');
  
  const btnTake = document.getElementById('btn-take-chat');
  const btnReturn = document.getElementById('btn-return-bot');
  const btnClose = document.getElementById('btn-close-chat');

  let currentConversationStatus = 'BOT';
  let currentAssignedAgent = null;

  // Render HTML for status indicator
  const renderStatus = (status, assignedAgentId) => {
    if (status === 'BOT') {
      return `<span class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-medium text-[10px] tracking-wide border border-blue-100">AI ASSISTANT</span>`;
    } else if (status === 'HUMAN') {
      if (assignedAgentId === currentAdminId) {
        return `<span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-medium text-[10px] tracking-wide border border-emerald-100">YOUR CHAT</span>`;
      } else {
        return `<span class="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 font-medium text-[10px] tracking-wide border border-rose-100">LOCKED</span>`;
      }
    } else if (status === 'CLOSED') {
      return `<span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium text-[10px] tracking-wide border border-slate-200">CLOSED</span>`;
    }
    return '';
  };

  // Update Action Buttons visibility
  const updateActionButtons = () => {
    btnTake.classList.add('hidden');
    btnReturn.classList.add('hidden');
    btnClose.classList.add('hidden');
    chatInput.disabled = true;
    btnSendMsg.disabled = true;
    chatInput.placeholder = "Chỉ có thể nhắn tin khi tiếp nhận hỗ trợ...";

    if (currentConversationStatus === 'BOT') {
      btnTake.classList.remove('hidden');
    } else if (currentConversationStatus === 'HUMAN') {
      if (currentAssignedAgent === currentAdminId) {
        btnReturn.classList.remove('hidden');
        btnClose.classList.remove('hidden');
        chatInput.disabled = false;
        btnSendMsg.disabled = false;
        chatInput.placeholder = "Nhập tin nhắn hỗ trợ...";
      } else {
        // Locked by someone else
        chatInput.placeholder = "Cuộc trò chuyện này đang được nhân viên khác hỗ trợ.";
      }
    }
  };

  const scrollToBottom = () => {
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  };

  const renderMessage = (message) => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message');
    messageDiv.classList.add(message.isAdmin ? 'self' : 'client');

    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    bubble.textContent = message.content;

    messageDiv.appendChild(bubble);
    chatMessagesContainer.appendChild(messageDiv);
    scrollToBottom();
  };

  const renderSystemMessage = (text) => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', 'system');
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    bubble.textContent = text;
    messageDiv.appendChild(bubble);
    chatMessagesContainer.appendChild(messageDiv);
    scrollToBottom();
  }

  // API Call to Take Conversation
  btnTake.addEventListener('click', async () => {
    const userId = currentChatUserId.value;
    if (!userId) return;
    try {
      loadingState.classList.remove('hidden');
      const res = await axios.post(`/admin/chats/take/${userId}`);
      if (res.data.success) {
        currentConversationStatus = 'HUMAN';
        currentAssignedAgent = currentAdminId;
        currentChatStatus.innerHTML = renderStatus(currentConversationStatus, currentAssignedAgent);
        updateActionButtons();
        renderSystemMessage("Bạn đã tiếp nhận cuộc trò chuyện này.");
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        alert("Cuộc trò chuyện này đã được nhân viên khác tiếp nhận!");
        loadHistory(userId); // Reload to get new status
      } else {
        alert("Có lỗi xảy ra khi tiếp nhận.");
      }
    } finally {
      loadingState.classList.add('hidden');
    }
  });

  // API Call to Return Bot
  btnReturn.addEventListener('click', async () => {
    const userId = currentChatUserId.value;
    if (!userId) return;
    try {
      loadingState.classList.remove('hidden');
      const res = await axios.post(`/admin/chats/return/${userId}`);
      if (res.data.success) {
        currentConversationStatus = 'BOT';
        currentAssignedAgent = null;
        currentChatStatus.innerHTML = renderStatus(currentConversationStatus, currentAssignedAgent);
        updateActionButtons();
        renderSystemMessage("Đã trả cuộc trò chuyện về cho AI Assistant.");
      }
    } catch (error) {
      alert("Có lỗi xảy ra hoặc bạn không có quyền thao tác.");
    } finally {
      loadingState.classList.add('hidden');
    }
  });

  // API Call to Close
  btnClose.addEventListener('click', async () => {
    const userId = currentChatUserId.value;
    if (!userId) return;
    try {
      loadingState.classList.remove('hidden');
      const res = await axios.post(`/admin/chats/close/${userId}`);
      if (res.data.success) {
        currentConversationStatus = 'CLOSED';
        currentAssignedAgent = null;
        currentChatStatus.innerHTML = renderStatus(currentConversationStatus, currentAssignedAgent);
        updateActionButtons();
        renderSystemMessage("Cuộc trò chuyện đã kết thúc.");
      }
    } catch (error) {
      alert("Có lỗi xảy ra hoặc bạn không có quyền thao tác.");
    } finally {
      loadingState.classList.add('hidden');
    }
  });

  const loadHistory = async (userId) => {
    try {
      const res = await axios.get(`/admin/chats/history/${userId}`);
      const history = res.data.history;
      const conversation = res.data.conversation;

      currentConversationStatus = conversation.status;
      currentAssignedAgent = conversation.assignedAgentId;
      
      currentChatStatus.innerHTML = renderStatus(currentConversationStatus, currentAssignedAgent);
      updateActionButtons();

      const isAtBottom = chatMessagesContainer.scrollHeight - chatMessagesContainer.scrollTop <= chatMessagesContainer.clientHeight + 10;
      
      chatMessagesContainer.innerHTML = '';
      if (history.length === 0) {
        chatMessagesContainer.innerHTML = '<div class="text-center text-slate-400 text-sm mt-4">Chưa có tin nhắn nào.</div>';
      } else {
        history.forEach(message => renderMessage(message));
      }
      
      if (isAtBottom) scrollToBottom();
    } catch (err) {
      console.log('Error loading history:', err);
    }
  };

  userItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      userItems.forEach(u => {
        u.classList.remove('bg-indigo-50', 'border-l-4', 'border-indigo-500');
        u.classList.add('border-l-4', 'border-transparent');
      });
      item.classList.remove('border-transparent');
      item.classList.add('bg-indigo-50', 'border-indigo-500');

      const userId = item.getAttribute('data-userid');
      const fullName = item.getAttribute('data-fullname');

      currentChatName.textContent = fullName;
      currentChatUserId.value = userId;
      
      emptyState.classList.add('hidden');
      chatWindow.classList.remove('hidden');
      chatWindow.classList.add('flex');
      
      chatMessagesContainer.innerHTML = '<div class="text-center text-slate-400 text-sm mt-4">Đang tải...</div>';
      loadHistory(userId);
      chatInput.focus();
    });
  });

  setInterval(() => {
    const targetUserId = currentChatUserId.value;
    if (targetUserId) {
      loadHistory(targetUserId);
    }
  }, 3000);

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = chatInput.value.trim();
    const targetUserId = currentChatUserId.value;

    if (content && targetUserId) {
      if (currentConversationStatus !== 'HUMAN' || currentAssignedAgent !== currentAdminId) {
        alert("Bạn không thể nhắn tin vì không sở hữu cuộc trò chuyện này.");
        return;
      }

      chatInput.value = '';
      try {
        const res = await axios.post('/admin/chats/send', {
          userId: targetUserId,
          content: content
        });
        const emptyMsg = chatMessagesContainer.querySelector('.text-center');
        if (emptyMsg) emptyMsg.remove();
        renderMessage(res.data);
      } catch (err) {
        console.log('Lỗi gửi tin nhắn', err);
        if (err.response && err.response.status === 403) {
          alert("Bạn không có quyền sở hữu cuộc trò chuyện này nữa.");
          loadHistory(targetUserId);
        }
      }
    }
  });

  // Submit on Enter
  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });
});
