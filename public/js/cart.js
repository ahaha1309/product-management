document.addEventListener('DOMContentLoaded', () => {
  const checkAll = document.querySelector('#check-all');
  const itemChecks = document.querySelectorAll('.item-check');
  const listPrice = document.querySelectorAll('.cart-price');
  const tempAmount = document.querySelector('.temp-amount');
  const totalAmount = document.querySelector('.total-amount');
  const plus = document.querySelectorAll('.plus');
  const minus = document.querySelectorAll('.minus');
  const listQuantity = document.querySelectorAll('.input-qty');
  const cartTotalAmount = document.querySelectorAll('.cart-item-total');
  const listProduct = document.querySelector('[name="listProduct"]');
  const deleteBtns = document.querySelectorAll('.btn-delete');

  // Helper to update header badges
  const updateBadges = (qty) => {
    const deskBadge = document.getElementById('desktop-cart-badge');
    const mobBadge = document.getElementById('mobile-cart-badge');
    if (deskBadge) { deskBadge.textContent = qty; deskBadge.classList.remove('hidden'); }
    if (mobBadge) { mobBadge.textContent = qty; mobBadge.classList.remove('hidden'); }
    if (qty === 0) {
      if (deskBadge) deskBadge.classList.add('hidden');
      if (mobBadge) mobBadge.classList.add('hidden');
      window.location.reload(); // Reload to show empty cart state
    }
  };

  // 👉 Hàm lấy giá
  const getPrice = (index) => {
    const priceText = listPrice[index].innerText.replace(/\D/g, '');
    return parseFloat(priceText) || 0;
  };

  // 👉 Hàm tính tổng
  const calculateTotal = () => {
    let currentTotal = 0;
    itemChecks.forEach((checkbox, index) => {
      // Find the parent item
      const itemRow = checkbox.closest('.cart-item');
      if (checkbox.checked && itemRow && itemRow.style.display !== 'none') {
        const qty = parseInt(listQuantity[index].value) || 0;
        currentTotal += qty * getPrice(index);
      }
    });
    currentTotal = Math.round(currentTotal);
    const formatted = '₫' + currentTotal.toLocaleString('vi-VN');
    if (tempAmount) tempAmount.innerText = formatted;
    if (totalAmount) totalAmount.innerText = formatted;
  };

  // 👉 Hàm update 1 item (Optimistic UI Rollback)
  const updateItem = (index, delta) => {
    const input = listQuantity[index];
    const prevQty = parseInt(input.value) || 0;
    let qty = prevQty + delta;
    if (qty < 1) qty = 1;

    // Optimistic Update
    input.value = qty;
    const total = qty * getPrice(index);
    cartTotalAmount[index].innerText = '₫' + total.toLocaleString('vi-VN');
    calculateTotal();

    const idUpdate = input.getAttribute('data-product-id');

    fetch(`/api/cart/update-quantity/${idUpdate}/${qty}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
      if (data.code !== '00') throw new Error(data.message);
    })
    .catch(err => {
      // Rollback
      input.value = prevQty;
      const prevTotal = prevQty * getPrice(index);
      cartTotalAmount[index].innerText = '₫' + prevTotal.toLocaleString('vi-VN');
      calculateTotal();
      window.dispatchEvent(new CustomEvent('nvh:toast', { detail: { type: 'error', message: err.message || 'Lỗi cập nhật số lượng' } }));
    });
  };

  // 👉 Delete Item
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const itemId = btn.getAttribute('data-id');
      const itemRow = btn.closest('.cart-item');
      
      // Optismitic Hide
      itemRow.style.display = 'none';
      calculateTotal();

      fetch(`/api/cart/delete/${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(res => res.json())
      .then(data => {
        if (data.code === '00') {
          itemRow.remove();
          updateBadges(data.data.cartQuantity);
          window.dispatchEvent(new CustomEvent('nvh:toast', { detail: { type: 'success', message: data.message } }));
        } else {
          throw new Error(data.message);
        }
      })
      .catch(err => {
        // Rollback
        itemRow.style.display = '';
        calculateTotal();
        window.dispatchEvent(new CustomEvent('nvh:toast', { detail: { type: 'error', message: err.message || 'Lỗi xoá sản phẩm' } }));
      });
    });
  });

  // 👉 Gắn sự kiện +
  plus.forEach((btn, index) => {
    btn.addEventListener('click', () => updateItem(index, 1));
  });

  // 👉 Gắn sự kiện -
  minus.forEach((btn, index) => {
    btn.addEventListener('click', () => updateItem(index, -1));
  });

  // Check all
  if (checkAll) {
    checkAll.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      itemChecks.forEach((cb) => (cb.checked = isChecked));
      calculateTotal();
    });
  }

  // Check từng item
  itemChecks.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const slug = checkbox.getAttribute('slug');
      const variant = checkbox.getAttribute('variant') || '';
      const itemVal = variant ? `${slug}|${variant}` : slug;

      const allChecked = Array.from(itemChecks).every((c) => c.checked || c.closest('.cart-item').style.display === 'none');
      if (checkAll) checkAll.checked = allChecked;
      calculateTotal();

      if (checkbox.checked) {
        const currentVals = listProduct.value ? listProduct.value.split(',').filter(v => v) : [];
        if (!currentVals.includes(itemVal)) currentVals.push(itemVal);
        listProduct.value = currentVals.join(',');
      } else {
        let currentVals = listProduct.value ? listProduct.value.split(',').filter(v => v) : [];
        currentVals = currentVals.filter(v => v !== itemVal);
        listProduct.value = currentVals.join(',');
      }
    });
  });
});
