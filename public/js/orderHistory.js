document.addEventListener('DOMContentLoaded', () => {
  const btnCancel = document.getElementById('btnCancelOrder');
  const statusOrder=document.querySelectorAll('.shopee-tabs a.tab-item')

  if (btnCancel) {
    btnCancel.addEventListener('click', async () => {
      const orderId = btnCancel.getAttribute('data-id');
      
      if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
        try {
          btnCancel.disabled = true;
          btnCancel.textContent = 'Đang xử lý...';

          const res = await fetch(`/order/cancel/${orderId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          const data = await res.json();

          if (res.ok) {
            alert('✓ Hủy đơn hàng thành công!');
            window.location.reload(); // Load lại trang để cập nhật trạng thái mới
          } else {
            alert(data.message || 'Không thể hủy đơn hàng');
            btnCancel.disabled = false;
            btnCancel.textContent = 'Hủy đơn hàng';
          }
        } catch (err) {
          alert('Lỗi kết nối, vui lòng thử lại');
          btnCancel.disabled = false;
          btnCancel.textContent = 'Hủy đơn hàng';
        }
      }
    });
  }
});