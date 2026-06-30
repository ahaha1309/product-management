document.addEventListener('DOMContentLoaded', () => {
  // Lấy tất cả các thẻ select trạng thái
  const selectsStatus = document.querySelectorAll('.select-status');

  if (selectsStatus.length > 0) {
    selectsStatus.forEach((select) => {
      select.addEventListener('change', async (e) => {
        const status = e.target.value;
        const orderId = e.target.getAttribute('data-id');

        if (confirm('Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng này?')) {
          try {
            // Gọi API cập nhật
            const response = await fetch(`/admin/orders/change-status/${orderId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status: status }),
            });

            const data = await response.json();

            if (data.code === 200) {
              alert('Cập nhật trạng thái thành công!');
              // Bạn có thể đổi màu background của dòng bảng tại đây nếu muốn đẹp hơn
            } else {
              alert('Có lỗi xảy ra, vui lòng thử lại!');
              window.location.reload(); // Reload nếu lỗi để trả về trạng thái cũ
            }
          } catch (error) {
            console.error('Error:', error);
            alert('Lỗi kết nối!');
          }
        } else {
          // Nếu Admin ấn Cancel (Không muốn đổi nữa), reset lại select về trạng thái cũ
          window.location.reload();
        }
      });
    });
  }
  // Thêm đoạn này vào trong document.addEventListener('DOMContentLoaded', ...)
  const selectsPaymentStatus = document.querySelectorAll('.select-payment-status');

  if (selectsPaymentStatus.length > 0) {
    selectsPaymentStatus.forEach((select) => {
      select.addEventListener('change', async (e) => {
        const paymentStatus = e.target.value;
        const orderId = e.target.getAttribute('data-id');

        if (confirm('Xác nhận thay đổi trạng thái thanh toán?')) {
          try {
            const response = await fetch(`/admin/orders/change-payment-status/${orderId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentStatus: paymentStatus }),
            });

            const data = await response.json();
            if (data.code === 200) {
              alert('Cập nhật trạng thái thanh toán thành công!');
            } else {
              alert('Có lỗi xảy ra!');
              window.location.reload();
            }
          } catch (error) {
            console.error(error);
            alert('Lỗi kết nối!');
          }
        } else {
          window.location.reload();
        }
      });
    });
  }
  //hiển thị popup
  const btnDetails = document.querySelectorAll('.btn-detail');
  
  // Khởi tạo Modal Tailwind
  const modalElement = document.getElementById('orderDetailModal');
  const modalInstance = {
    show: () => modalElement.classList.remove('hidden'),
    hide: () => modalElement.classList.add('hidden')
  };
  
  // Nút đóng modal
  document.querySelectorAll('[data-bs-dismiss="modal"]').forEach(btn => {
    btn.addEventListener('click', () => modalInstance.hide());
  });

  btnDetails.forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-id');
      
      try {
        // Gọi API lấy thông tin đơn hàng (trả về JSON)
        const response = await fetch(`/admin/orders/detail/${id}?type=json`);
        const data = await response.json();

        if (data.code === 200) {
          const order = data.order;
          const user = data.user;
          
          // 1. Đổ thông tin chung vào modal
          document.getElementById('modalOrderCode').innerText = order.orderCode;
          document.getElementById('modalCustomerName').innerText = user.fullName;
          document.getElementById('modalCustomerPhone').innerText = user.phone;
          document.getElementById('modalCustomerAddress').innerText = user.address;
          document.getElementById('modalPaymentMethod').innerText = order.paymentMethod;
          document.getElementById('modalPaymentStatus').innerText = order.paymentStatus === 'success' ? 'Đã thanh toán' : 'Chờ thanh toán';
          document.getElementById('modalTotalAmount').innerText = order.amount.toLocaleString('vi-VN') + '₫';

          // 2. Đổ danh sách sản phẩm
          const productListBody = document.getElementById('modalProductList');
          productListBody.innerHTML = ''; // Xóa dữ liệu cũ

          order.products.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td class="text-center"><img src="${item.thumbnail}" width="50" style="border-radius: 4px;"></td>
              <td>${item.title}</td>
              <td>${item.newPrice.toLocaleString('vi-VN')}₫</td>
              <td class="text-center">${item.quantity}</td>
              <td class="font-weight-bold">${(item.newPrice * item.quantity).toLocaleString('vi-VN')}₫</td>
            `;
            productListBody.appendChild(tr);
          });

          // 3. Update print invoice link
          document.getElementById('btn-print-invoice').href = `/admin/orders/print/${order._id}`;

          // 4. Hiển thị modal (Dùng cú pháp của JS thuần, đặt ngay sau khi đổ dữ liệu xong)
          modalInstance.show();
        }
      } catch (error) {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
        alert("Không thể tải thông tin chi tiết!");
      }
    });
  });
});
