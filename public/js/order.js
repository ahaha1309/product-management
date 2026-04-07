document.addEventListener('DOMContentLoaded',()=>{
       // ==========================================
    // HELPER: Hiển thị toast thông báo
    // ==========================================
    function showToast(message, type = 'success') {
      const toast = document.getElementById('checkoutToast');
      const toastMsg = document.getElementById('toastMessage');
      toast.className = `checkout-toast ${type}`;
      toastMsg.textContent = message;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 4000);
    }

    // ==========================================
    // Toggle edit form
    // ==========================================
    document.querySelector('.edit-link').addEventListener('click', (e) => {
      e.preventDefault();
      const shippingInfo = document.querySelector('.shipping-info');
      const editForm = document.querySelector('.edit-form');
      shippingInfo.style.display = shippingInfo.style.display === 'none' ? 'block' : 'none';
      editForm.style.display = editForm.style.display === 'none' ? 'block' : 'none';
    });

    // Save shipping info
    document.querySelector('.btn-save').addEventListener('click', () => {
      const fullName = document.getElementById('editFullName').value.trim();
      const phone = document.getElementById('editPhone').value.trim();
      const address = document.getElementById('editAddress').value.trim();

      if (!fullName || !phone || !address) {
        alert('Vui lòng điền đầy đủ thông tin giao hàng');
        return;
      }

      // TODO: Gọi API cập nhật thông tin user nếu cần
      document.querySelector('.shipping-info').style.display = 'block';
      document.querySelector('.edit-form').style.display = 'none';
      showToast('✓ Cập nhật thông tin thành công!');
    });

    // Cancel edit
    document.querySelector('.btn-cancel').addEventListener('click', () => {
      document.querySelector('.shipping-info').style.display = 'block';
      document.querySelector('.edit-form').style.display = 'none';
    });

    // ==========================================
    // Apply voucher
    // ==========================================
    document.getElementById('applyVoucher').addEventListener('click', async () => {
      const code = document.getElementById('voucherCode').value.trim();
      if (!code) {
        showToast('Vui lòng nhập mã voucher', 'error');
        return;
      }

      try {
        const res = await fetch('/checkout/apply-voucher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          showToast(`✓ Áp dụng voucher "${code}" thành công!`);
          location.reload();
        } else {
          showToast(data.message || 'Mã voucher không hợp lệ', 'error');
        }
      } catch (err) {
        showToast('Lỗi kết nối, vui lòng thử lại', 'error');
      }
    });

    // Remove voucher
    if (document.querySelector('.btn-remove-voucher')) {
      document.querySelector('.btn-remove-voucher').addEventListener('click', () => {
        location.reload();
      });
    }

    // ==========================================
    // Remove product
    // ==========================================
    document.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.target.closest('[data-product-id]').dataset.productId;
        if (confirm('Xóa sản phẩm này?')) {
          e.target.closest('.product-item').remove();
        }
      });
    });

    // ==========================================
    // CHECKOUT: POST đến /checkout/create-payment-url
    // ==========================================
    document.getElementById('checkoutBtn').addEventListener('click', async () => {
      const btn = document.getElementById('checkoutBtn');

      // Lấy phương thức thanh toán đang được chọn
      const paymentMethodEl = document.querySelector('input[name="paymentMethod"]:checked');
      if (!paymentMethodEl) {
        showToast('Vui lòng chọn phương thức thanh toán', 'error');
        return;
      }

      // Thu thập danh sách sản phẩm còn lại trên trang
      const productItems = document.querySelectorAll('.product-item');
      if (productItems.length === 0) {
        showToast('Giỏ hàng trống, vui lòng thêm sản phẩm', 'error');
        return;
      }

      const products = Array.from(productItems).map(item => ({
        id: item.querySelector('.btn-remove')?.dataset.productId
      }));
      const totalPrice=document.querySelector('.price-total').textContent;
      const totalPriceNumber=Number(totalPrice.replace(/[^\d]/g, ""));
      // Lấy mã voucher (nếu có)
      const voucherCode = document.getElementById('voucherCode')?.value.trim() || null;

      // Thông tin giao hàng (lấy từ input nếu đang edit, hoặc từ server-rendered)
      const payload = {
        paymentMethod : paymentMethodEl.value,
        products      : products,
        voucherCode   : voucherCode,
        amount: totalPriceNumber,
        orderCode: 'ORD'+'-'+ Date.now()
        // Nếu bạn cần gửi thêm thông tin khác (shippingFee, total...) thêm vào đây
      };

      // Disable nút tránh double-click
      btn.disabled = true;
      btn.textContent = 'Đang xử lý...';

      try {
        const res = await fetch('/checkout/create-payment-url', {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.paymentUrl) {
          // Server trả về URL thanh toán → redirect
          showToast('✓ Đang chuyển đến trang thanh toán...');
          setTimeout(() => { window.location.href = data.paymentUrl; }, 800);
        } else {
          // Server trả về lỗi
          showToast(data.message || 'Đặt hàng thất bại, vui lòng thử lại', 'error');
          btn.disabled = false;
          btn.textContent = 'Đặt hàng';
        }
      } catch (err) {
        showToast('Lỗi kết nối, vui lòng thử lại', 'error');
        btn.disabled = false;
        btn.textContent = 'Đặt hàng';
      }
    });
})