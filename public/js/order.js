document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // HELPER: Hiển thị toast thông báo
  // ==========================================
  function showToast(message, type = 'success') {
    const toast = document.getElementById('checkoutToast');
    const toastMsg = document.getElementById('toastMessage');
    toast.className = `checkout-toast ${type}`;
    toastMsg.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 4000);
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
  // Apply voucher via AJAX
  // ==========================================
  
  // Lấy tổng tiền ban đầu khi load trang (đã bao gồm phí ship, nhưng chưa trừ voucher - voucher nếu có thì server render đã trừ, nhưng ta lấy total gốc)
  const initialTotalElement = document.querySelector('.price-total');
  let originalTotal = 0;
  if (initialTotalElement) {
    const rawTotal = initialTotalElement.getAttribute('data-raw-total') || initialTotalElement.textContent.replace(/[^\d]/g, '');
    originalTotal = Number(rawTotal);
    // Gắn thuộc tính data-raw-total để giữ lại giá trị gốc nếu chưa có
    if (!initialTotalElement.hasAttribute('data-raw-total')) {
      initialTotalElement.setAttribute('data-raw-total', originalTotal);
    }
  }

  async function applyVoucherAjax(code) {
    if (!code) return;
    
    // Tính tổng tiền sản phẩm (chưa tính ship)
    const productItems = document.querySelectorAll('.product-item');
    let subTotal = 0;
    productItems.forEach(item => {
      const quantityText = item.querySelector('.product-quantity').textContent.replace('x', '');
      const quantity = parseInt(quantityText, 10) || 1;
      const priceText = item.querySelector('.text-brand-600').textContent.replace(/[^\d]/g, '');
      const price = parseInt(priceText, 10) || 0;
      subTotal += (price * quantity);
    });

    try {
      const res = await fetch('/order/validate-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, amount: subTotal })
      });
      const data = await res.json();
      
      if (res.ok && data.code === 200) {
        showToast(`✓ Áp dụng thành công mã ${data.voucher.code}!`);
        
        // Cập nhật giao diện
        // 1. Thêm/cập nhật dòng hiển thị giảm giá trong Tóm tắt
        const summaryDiv = document.querySelector('.order-summary');
        let discountItem = summaryDiv.querySelector('.summary-discount');
        if (!discountItem) {
          discountItem = document.createElement('div');
          discountItem.className = 'summary-item summary-discount flex justify-between items-center text-sm font-semibold text-emerald-600 mb-4';
          // Chèn trước cái divider
          const divider = summaryDiv.querySelector('.summary-divider');
          summaryDiv.insertBefore(discountItem, divider);
        }
        discountItem.innerHTML = `<span>Giảm giá (${data.voucher.percentage}%):</span><span>-${data.voucher.discountAmount.toLocaleString('vi-VN')}₫</span>`;
        
        // 2. Cập nhật tổng tiền cuối cùng (Subtotal + Ship - Discount)
        const newTotal = subTotal + 30000 - data.voucher.discountAmount; // 30000 là phí ship mặc định
        const totalEl = document.querySelector('.price-total');
        totalEl.textContent = `${newTotal.toLocaleString('vi-VN')}₫`;
        
        // Cập nhật thẻ input voucher
        const input = document.getElementById('voucherCode');
        if (input) input.value = data.voucher.code;

        // Cập nhật state active cho voucher tags
        document.querySelectorAll('.voucher-tag').forEach(tag => {
          if (tag.dataset.code === data.voucher.code) {
             tag.classList.add('border-brand-500', 'bg-brand-50');
             tag.classList.remove('border-slate-200');
          } else {
             tag.classList.remove('border-brand-500', 'bg-brand-50');
             tag.classList.add('border-slate-200');
          }
        });

      } else {
        showToast(data.message || 'Mã voucher không hợp lệ', 'error');
      }
    } catch (error) {
      showToast('Lỗi kết nối khi áp dụng voucher', 'error');
    }
  }

  document.getElementById('applyVoucher').addEventListener('click', () => {
    const code = document.getElementById('voucherCode').value.trim();
    if (!code) {
      showToast('Vui lòng nhập mã voucher', 'error');
      return;
    }
    applyVoucherAjax(code);
  });

  // Select voucher from list
  document.querySelectorAll('.voucher-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const code = tag.dataset.code;
      applyVoucherAjax(code);
    });
  });

  // Remove voucher (AJAX style - just reset DOM)
  const btnRemoveVoucher = document.querySelector('.btn-remove-voucher');
  if (btnRemoveVoucher) {
    btnRemoveVoucher.addEventListener('click', () => {
      // Logic for removing a voucher applied on server-side during page load
      const url = new URL(window.location.href);
      url.searchParams.delete('voucherCode');
      window.location.href = url.toString();
    });
  }
  //chỉnh sửa thông tin cá nhân;
  const formEdit = document.querySelector('.edit-form');
  const btnEdit = formEdit.querySelector('.form-actions .btn-save');
  btnEdit.addEventListener('click', async (e) => {
    e.preventDefault();
    const name = formEdit.querySelector('#editFullName');
    const phone = formEdit.querySelector('#editPhone');
    const address = formEdit.querySelector('#editAddress');
    const data = {
      id: formEdit.getAttribute('idUser'),
      name: name.value,
      phone: phone.value,
      address: address.value,
    };
    const res = await fetch('/order/update-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const infoValues = document.querySelectorAll('.shipping-info .info-value');

      infoValues[0].textContent = `${name.value} | ${phone.value}`;
      infoValues[1].textContent = address.value;

      document.querySelector('.shipping-info').style.display = 'block';
      document.querySelector('.edit-form').style.display = 'none';
    }
  });

  // ==========================================
  // Remove product
  // ==========================================
  document.querySelectorAll('.btn-remove').forEach((btn) => {
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

    // Thu thập danh sách sản phẩm và số lượng
    const products = Array.from(productItems).map((item) => {
      const id = item.querySelector('.btn-remove')?.dataset.productId;

      // Lấy chuỗi hiển thị số lượng (VD: "x2"), bỏ chữ "x" và ép kiểu về số nguyên
      const quantityText = item
        .querySelector('.product-quantity')
        .textContent.replace('x', '');
      const quantity = parseInt(quantityText, 10) || 1;
      
      const variantTextEl = item.querySelector('.product-variant');
      let variantText = '';
      if (variantTextEl) {
        variantText = variantTextEl.textContent.replace('Phân loại:', '').trim();
        if (variantText === 'Mặc định') variantText = '';
      }

      return {
        productId: id,
        quantity: quantity,
        variantText: variantText
      };
    });
    const totalPrice = document.querySelector('.price-total').textContent;
    const totalPriceNumber = Number(totalPrice.replace(/[^\d]/g, ''));
    // Lấy mã voucher (nếu có)
    const voucherCode = document.getElementById('voucherCode')?.value.trim() || null;

    // Thông tin giao hàng (lấy từ input nếu đang edit, hoặc từ server-rendered)
    const fullName = document.getElementById('editFullName')?.value.trim() 
      || document.querySelector('.shipping-info .info-value')?.textContent.split('|')[0]?.trim() || '';
    const phone = document.getElementById('editPhone')?.value.trim() 
      || document.querySelector('.shipping-info .info-value')?.textContent.split('|')[1]?.trim() || '';
    const address = document.getElementById('editAddress')?.value.trim() 
      || document.querySelectorAll('.shipping-info .info-value')[1]?.textContent.trim() || '';
    const orderNote = document.getElementById('orderNote')?.value.trim() || '';

    // VALIDATION
    if (!fullName || !phone || !address) {
      showToast('Vui lòng cung cấp đầy đủ thông tin giao hàng', 'error');
      return;
    }
    const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
    if (!phoneRegex.test(phone)) {
      showToast('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10 số).', 'error');
      return;
    }

    const payload = {
      paymentMethod: paymentMethodEl.value,
      products: products,
      voucherCode: voucherCode,
      amount: totalPriceNumber,
      shippingAddress: {
        fullName: fullName,
        phone: phone,
        address: address,
      },
      orderNote: orderNote,
    };

    // Disable nút tránh double-click
    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';

    try {
      const res = await fetch('/order/create-payment-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.paymentUrl) {
          // Xử lý luồng thanh toán online (VNPAY)
          showToast('✓ Đang chuyển đến trang thanh toán...');
          setTimeout(() => {
            window.location.href = data.paymentUrl;
          }, 800);
        } else if (data.isCOD) {
          // Xử lý luồng COD (Chỉ chèn database)
          showToast('✓ Đặt hàng thành công!');
          setTimeout(() => {
            // Chuyển hướng người dùng về trang chủ hoặc trang lịch sử đơn hàng
            window.location.href = '/';
          }, 1500);
        } else {
          // Trường hợp trả về lỗi từ logic nghiệp vụ của server
          showToast(data.message || 'Đặt hàng thất bại, vui lòng thử lại', 'error');
          btn.disabled = false;
          btn.textContent = 'Đặt hàng';
        }
      } else {
        // Lỗi HTTP (400, 500...)
        showToast(data.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error');
        btn.disabled = false;
        btn.textContent = 'Đặt hàng';
      }
    } catch (err) {
      showToast('Lỗi kết nối, vui lòng thử lại', 'error');
      btn.disabled = false;
      btn.textContent = 'Đặt hàng';
    }
  });
});
