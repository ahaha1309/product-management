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
  
  // 👉 Hàm lấy giá (tái sử dụng)
  const getPrice = (index) => {
    return parseFloat(listPrice[index].innerText.replace(/[^0-9.]/g, '')) || 0;
  };

  // 👉 Hàm update 1 item
  const updateItem = (index, delta) => {
    let qty = parseInt(listQuantity[index].value) || 0;
    qty += delta;

    if (qty < 1) qty = 1; // chặn âm

    listQuantity[index].value = qty;

    const total = qty * getPrice(index);
    cartTotalAmount[index].innerText = total.toLocaleString() + ' $';

    calculateTotal();
  };

  // 👉 Hàm tính tổng
  const calculateTotal = () => {
    let currentTotal = 0;

    itemChecks.forEach((checkbox, index) => {
      if (checkbox.checked) {
        const qty = parseInt(listQuantity[index].value) || 0;
        currentTotal += qty * getPrice(index);
      }
    });

    const formatted = currentTotal.toLocaleString() + ' $';
    tempAmount.innerText = formatted;
    totalAmount.innerText = formatted;
  };

  // 👉 Gắn sự kiện +
  plus.forEach((btn, index) => {
    btn.addEventListener('click', () => updateItem(index, 1));
  });

  // 👉 Gắn sự kiện -
  minus.forEach((btn, index) => {
    btn.addEventListener('click', () => updateItem(index, -1));
  });

  // 👉 Check all
  if (checkAll) {
    checkAll.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      itemChecks.forEach(cb => cb.checked = isChecked);
      calculateTotal();
    });
  }

  // 👉 Check từng item
  itemChecks.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const allChecked = Array.from(itemChecks).every(c => c.checked);
      if (checkAll) checkAll.checked = allChecked;
      calculateTotal();
    });
  });
});