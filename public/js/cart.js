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
  const listProduct=document.querySelector('[name="listProduct"]')

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
    cartTotalAmount[index].innerText = total + ' $';

    calculateTotal();

    const idUpdate = listQuantity[index].getAttribute('data-product-id');
    const formUpdate = document.querySelector('[form-update-quantity]');
    const dataPath = formUpdate.getAttribute('data-path');

  fetch(`${dataPath}/${idUpdate}/${qty}`, {
    method: "PATCH"
  })
  .then(res => res.json())
  .then(data => console.log("updated"))
  .catch(err => console.log(err));
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

    const formatted = currentTotal + ' $';
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
      const id=checkbox.value;
      const allChecked = Array.from(itemChecks).every((c) => c.checked);
      if (checkAll) checkAll.checked = allChecked;
      calculateTotal();

      if (checkbox.checked) {
        listProduct.value += id + ',';
      } else {
        const ids = listProduct.value.split(',').filter((id) => id && id != checkbox.value);
        listProduct.value = ids.join(',') + (ids.length > 0 ? ',' : '');
      }
    });
  });
});
