document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('admin-notification-badge');
  const listContainer = document.getElementById('admin-notification-list');
  const btnMarkAllRead = document.getElementById('btn-mark-all-read');
  const prefixAdmin = window.location.pathname.split('/')[1]; // Lấy prefix admin từ URL, ví dụ 'admin'
  let unreadCount = 0;

  // Khởi tạo socket
  const socket = io();

  // Hàm render 1 thông báo
  const renderNotificationItem = (notif) => {
    const isUnread = !notif.read;
    const date = new Date(notif.createdAt || notif.time);
    const timeString = date.toLocaleString('vi-VN');

    return `
      <a href="${notif.link || '#'}" class="block p-4 hover:bg-surface-50 transition-colors ${isUnread ? 'bg-brand-50/30' : ''}">
        <div class="flex gap-3">
          <div class="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
            <i class="bi bi-box-seam"></i>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-surface-900 ${isUnread ? 'text-brand-600' : ''}">${notif.title}</h4>
            <p class="text-xs text-surface-600 mt-0.5">${notif.message}</p>
            <span class="text-[10px] font-medium text-surface-400 mt-1.5 block">${timeString}</span>
          </div>
        </div>
      </a>
    `;
  };

  // Cập nhật số lượng
  const updateBadge = (count) => {
    unreadCount = count;
    if (unreadCount > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  };

  // Lấy dữ liệu lần đầu
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/${prefixAdmin}/notifications`);
      const data = await res.json();
      
      if (data.code === 200) {
        updateBadge(data.unreadCount);
        
        if (data.notifications.length === 0) {
          listContainer.innerHTML = '<div class="p-6 text-center text-surface-500 text-sm">Chưa có thông báo nào</div>';
        } else {
          listContainer.innerHTML = data.notifications.map(n => renderNotificationItem(n)).join('');
        }
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  // Đánh dấu đã đọc
  btnMarkAllRead?.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/${prefixAdmin}/notifications/read-all`, { method: 'PATCH' });
      const data = await res.json();
      if (data.code === 200) {
        updateBadge(0);
        fetchNotifications(); // Render lại
      }
    } catch (e) {
      console.error('Error marking as read:', e);
    }
  });

  // Lắng nghe socket
  socket.on('ADMIN_NEW_NOTIFICATION', (data) => {
    // Tăng count
    updateBadge(unreadCount + 1);
    
    // Thêm vào đầu list
    const newItemHtml = renderNotificationItem({ ...data, read: false });
    
    // Nếu đang rỗng thì xóa text rỗng
    if (listContainer.innerHTML.includes('Chưa có thông báo nào') || listContainer.innerHTML.includes('Đang tải')) {
      listContainer.innerHTML = '';
    }
    
    listContainer.insertAdjacentHTML('afterbegin', newItemHtml);

    // Có thể show toast góc màn hình
    // ...
  });

  // Init
  fetchNotifications();
});
