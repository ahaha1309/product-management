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

  // 👉 Hàm lấy giá (tái sử dụng)
  const getPrice = (index) => {
    // Loại bỏ tất cả ký tự không phải là số (xóa cả dấu chấm phân cách hàng nghìn)
    const priceText = listPrice[index].innerText.replace(/\D/g, '');
    return parseFloat(priceText) || 0;
  };
  // 👉 Hàm update 1 item
  const updateItem = (index, delta) => {
    let qty = parseInt(listQuantity[index].value) || 0;
    qty += delta;

    if (qty < 1) qty = 1; // chặn âm

    listQuantity[index].value = qty;

    const total = qty * getPrice(index);
    cartTotalAmount[index].innerText = total.toLocaleString('vi-VN') + ' $';

    calculateTotal();

    const idUpdate = listQuantity[index].getAttribute('data-product-id');
    const formUpdate = document.querySelector('[form-update-quantity]');
    const dataPath = formUpdate.getAttribute('data-path');

    fetch(`${dataPath}/${idUpdate}/${qty}`, {
      method: 'PATCH',
    })
      .then((res) => res.json())
      .then((data) => console.log('updated'))
      .catch((err) => console.log(err));
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
    currentTotal = Math.round(currentTotal);
    const formatted = currentTotal.toLocaleString('vi-VN') + ' $';
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

  //  Check all
  if (checkAll) {
    checkAll.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      itemChecks.forEach((cb) => (cb.checked = isChecked));
      calculateTotal();
    });
  }

  //  Check từng item
  itemChecks.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const slug = checkbox.getAttribute('slug');
      const allChecked = Array.from(itemChecks).every((c) => c.checked);
      if (checkAll) checkAll.checked = allChecked;
      calculateTotal();

      if (checkbox.checked) {
        listProduct.value += slug + ',';
      } else {
        const slugs = listProduct.value
          .split(',')
          .filter((slug) => slug && slug != checkbox.getAttribute('slug'));
        listProduct.value = slugs.join(',') + (slugs.length > 0 ? ',' : '');
      }
    });
  });
});
