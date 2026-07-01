document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // INSTALLMENT (TRẢ GÓP) LOGIC
  // ==========================================
  const instSwitch = document.getElementById('instSwitch');
  const instBody = document.getElementById('instBody');
  const summaryInstallment = document.getElementById('summaryInstallment');

  if (instSwitch && instBody) {
    // Get product total from DOM
    function getProductSubtotal() {
      let sub = 0;
      document.querySelectorAll('.product-item').forEach(item => {
        const qty = parseInt(item.querySelector('.product-quantity').textContent.replace('x', '')) || 1;
        const price = parseInt(item.querySelector('.text-brand-600').textContent.replace(/[^\d]/g, '')) || 0;
        sub += price * qty;
      });
      return sub;
    }

    function updateInstallmentCalc() {
      const activeCard = document.querySelector('.inst-card.active');
      const months = activeCard ? parseInt(activeCard.dataset.months) : 6;
      const sub = getProductSubtotal();
      const downPayment = Math.round(sub * 0.3);
      const remaining = Math.round(sub * 0.7);
      const monthly = Math.round(remaining / months);

      const elDown = document.getElementById('instDownPayment');
      const elRem = document.getElementById('instRemaining');
      const elMon = document.getElementById('instMonthly');
      if (elDown) elDown.textContent = downPayment.toLocaleString('vi-VN');
      if (elRem) elRem.textContent = remaining.toLocaleString('vi-VN');
      if (elMon) elMon.textContent = monthly.toLocaleString('vi-VN') + '₫';

      // Update summary panel
      if (summaryInstallment) {
        const labelEl = summaryInstallment.querySelector('#instMonthsLabel');
        const monthlyEl = summaryInstallment.querySelector('#summaryMonthly');
        if (labelEl) labelEl.textContent = months;
        if (monthlyEl) monthlyEl.textContent = monthly.toLocaleString('vi-VN') + '₫';
      }
    }

    // Toggle installment on/off
    instSwitch.addEventListener('change', () => {
      const isOn = instSwitch.checked;
      instBody.style.display = isOn ? 'block' : 'none';
      if (summaryInstallment) summaryInstallment.style.display = isOn ? 'block' : 'none';

      const totalEl = document.querySelector('.price-total');
      const totalLabel = document.getElementById('totalLabel');
      const totalNote = document.getElementById('totalNote');
      const checkoutBtn = document.getElementById('checkoutBtn');

      if (isOn) {
        // Auto-select credit_card
        const creditCardInput = document.querySelector('input[name="paymentMethod"][value="credit_card"]');
        if (creditCardInput) {
          creditCardInput.checked = true;
          document.querySelectorAll('.pay-card').forEach(card => card.classList.remove('selected'));
          creditCardInput.closest('.pay-card')?.classList.add('selected');
        }

        updateInstallmentCalc();

        // Switch total to show down payment (30%)
        const sub = getProductSubtotal();
        const shippingFee = 30000;
        const downPayment = Math.round((sub + shippingFee) * 0.3);
        if (totalEl) totalEl.textContent = downPayment.toLocaleString('vi-VN') + '₫';
        if (totalLabel) totalLabel.textContent = 'Trả ngay (30%)';
        if (totalNote) totalNote.textContent = 'Số còn lại chia theo kỳ hạn';
        if (checkoutBtn) {
          checkoutBtn.querySelector('span').innerHTML = '<i class="bi bi-credit-card-fill"></i> Xác nhận trả góp';
        }
      } else {
        // Restore original total
        const origTotal = document.querySelector('.price-total').getAttribute('data-orig-total');
        if (origTotal && totalEl) totalEl.textContent = parseInt(origTotal).toLocaleString('vi-VN') + '₫';
        if (totalLabel) totalLabel.textContent = 'Tổng thanh toán';
        if (totalNote) totalNote.textContent = 'Đã bao gồm VAT';
        if (checkoutBtn) {
          checkoutBtn.querySelector('span').innerHTML = '<i class="bi bi-bag-check-fill"></i> Đặt hàng ngay';
        }
      }
    });

    // Month card selection
    document.querySelectorAll('.inst-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.inst-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        updateInstallmentCalc();
      });
    });
  }

  // Payment card visual sync (for pay-card selected class)
  document.querySelectorAll('.pay-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.pay-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });
  // Init selected state on load
  const checkedPay = document.querySelector('input[name="paymentMethod"]:checked');
  if (checkedPay) checkedPay.closest('.pay-card')?.classList.add('selected');

  // Store original total for restoring when installment is toggled off
  const priceTotal = document.querySelector('.price-total');
  if (priceTotal && !priceTotal.hasAttribute('data-orig-total')) {
    const raw = priceTotal.textContent.replace(/[^\d]/g, '');
    priceTotal.setAttribute('data-orig-total', raw);
  }

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
        showToast(`Áp dụng thành công mã ${data.voucher.code}!`);
        
        const summaryDiv = document.querySelector('.order-summary');
        const totalEl = document.querySelector('.price-total');
        const BASE_SHIP = 30000;

        if (data.voucher.type === 'freeship') {
          // --- FREESHIP: cập nhật dòng phí vận chuyển ---
          let discountItem = summaryDiv.querySelector('.summary-discount');
          const lineItems = summaryDiv.querySelector('.summary-line-items');
          if (!discountItem) {
            discountItem = document.createElement('div');
            discountItem.className = 'summary-discount flex items-center justify-between text-emerald-400 font-semibold';
            if (lineItems) lineItems.appendChild(discountItem);
          }
          discountItem.innerHTML = `<span><i class="bi bi-truck mr-1"></i>Freeship</span><span>-${BASE_SHIP.toLocaleString('vi-VN')}₫</span>`;

          // Cập nhật dòng phí ship thành Miễn phí
          const shipRow = summaryDiv.querySelector('.summary-shipping');
          if (shipRow) {
            shipRow.innerHTML = '<span class="text-zinc-400 font-medium">Phí vận chuyển</span><div class="text-right"><span class="line-through text-zinc-600 text-xs mr-1">30.000₫</span><span class="text-emerald-400 font-semibold">Miễn phí</span></div>';
          }

          // Giảm tổng đi 30.000
          const newTotal = subTotal + BASE_SHIP - BASE_SHIP;
          if (totalEl) {
            totalEl.textContent = `${(subTotal).toLocaleString('vi-VN')}₫`;
            totalEl.setAttribute('data-orig-total', subTotal);
          }

        } else {
          // --- PERCENTAGE: cập nhật dòng giảm giá ---
          let discountItem = summaryDiv.querySelector('.summary-discount');
          const lineItems = summaryDiv.querySelector('.summary-line-items');
          if (!discountItem) {
            discountItem = document.createElement('div');
            discountItem.className = 'summary-discount flex items-center justify-between text-emerald-400 font-semibold';
            if (lineItems) lineItems.appendChild(discountItem);
          }
          discountItem.innerHTML = `<span>Giảm giá (${data.voucher.percentage}%)</span><span>-${data.voucher.discountAmount.toLocaleString('vi-VN')}₫</span>`;

          const newTotal = subTotal + BASE_SHIP - data.voucher.discountAmount;
          if (totalEl) {
            totalEl.textContent = `${newTotal.toLocaleString('vi-VN')}₫`;
            totalEl.setAttribute('data-orig-total', newTotal);
          }
          
          // Phục hồi lại dòng phí ship nếu trước đó là freeship
          const shipRow = summaryDiv.querySelector('.summary-shipping');
          if (shipRow) {
            shipRow.innerHTML = '<span class="text-zinc-400 font-medium">Phí vận chuyển</span><span class="font-semibold text-white">30.000₫</span>';
          }
        }

        // Cập nhật input + active state
        const input = document.getElementById('voucherCode');
        if (input) input.value = data.voucher.code;

        document.querySelectorAll('.voucher-tag').forEach(tag => {
          if (tag.dataset.code === data.voucher.code) {
            tag.classList.add('border-emerald-500', 'bg-emerald-50');
            tag.classList.remove('border-slate-200');
          } else {
            tag.classList.remove('border-emerald-500', 'bg-emerald-50');
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
