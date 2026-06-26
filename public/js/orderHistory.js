document.addEventListener('DOMContentLoaded', () => {
  // ===== HỦY ĐƠN HÀNG =====
  // Xử lý nút hủy trên trang lịch sử (nhiều nút) và trang chi tiết (1 nút)
  const cancelButtons = document.querySelectorAll('.btn-cancel-order, #btnCancelOrder');

  cancelButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId = btn.getAttribute('data-id');

      if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;

      try {
        btn.disabled = true;
        btn.textContent = 'Đang xử lý...';

        const res = await fetch(`/order/cancel/${orderId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        if (res.ok) {
          alert('✓ ' + (data.message || 'Hủy đơn hàng thành công!'));
          window.location.reload();
        } else {
          alert(data.message || 'Không thể hủy đơn hàng');
          btn.disabled = false;
          btn.textContent = 'Hủy đơn';
        }
      } catch (err) {
        alert('Lỗi kết nối, vui lòng thử lại');
        btn.disabled = false;
        btn.textContent = 'Hủy đơn';
      }
    });
  });
});