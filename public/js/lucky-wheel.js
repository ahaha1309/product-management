document.addEventListener('DOMContentLoaded', () => {
  // 1. Logic Copy Code
  const copyBtns = document.querySelectorAll('.btn-copy-code');
  const copyToast = document.getElementById('copyToast');

  copyBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const code = btn.getAttribute('data-code');
      try {
        await navigator.clipboard.writeText(code);
        
        // Hiện toast
        copyToast.classList.remove('opacity-0', 'invisible');
        copyToast.classList.add('opacity-100', 'visible', '-translate-y-4');
        
        setTimeout(() => {
          copyToast.classList.remove('opacity-100', 'visible', '-translate-y-4');
          copyToast.classList.add('opacity-0', 'invisible');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    });
  });

  // 2. Logic Vòng Quay
  const wheel = document.getElementById('wheel');
  const spinBtn = document.getElementById('spinBtn');
  const modal = document.getElementById('prizeModal');
  const backdrop = modal.querySelector('.prize-backdrop');
  const content = modal.querySelector('.prize-content');
  const closeBtn = document.getElementById('closePrizeBtn');
  
  let isSpinning = false;
  let currentRotation = 0;

  spinBtn.addEventListener('click', async () => {
    if (isSpinning) return;
    isSpinning = true;

    try {
      const response = await fetch('/vouchers/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (!data.success) {
        alert(data.message || 'Có lỗi xảy ra!');
        isSpinning = false;
        return;
      }

      // Xác định góc quay dựa trên giải thưởng
      // Các ô trong pug:
      // Lần sau: 30, 150, 270 (index 0, 2, 4)
      // Voucher %: 90, 210 (index 1, 3)
      // Freeship: 330 (index 5)
      
      let targetSlice;
      if (data.prizeType === 'empty') {
        // Chọn ngẫu nhiên ô Lần sau
        const empties = [30, 150, 270];
        targetSlice = empties[Math.floor(Math.random() * empties.length)];
      } else if (data.voucher && data.voucher.type === 'freeship') {
        targetSlice = 330;
      } else {
        // Voucher phần trăm
        const percents = [90, 210];
        targetSlice = percents[Math.floor(Math.random() * percents.length)];
      }

      // Vòng quay CSS bị lệch 90 độ (do bắt đầu từ 0deg ở trên cùng)
      // Cần tính toán góc kết thúc để mũi tên chỉ đúng vào giữa slice.
      // 1 slice = 60deg. Mũi tên nằm ở góc 0deg (top).
      // Để ô target Slice nằm ở top, cần xoay vòng một góc = 360 - targetSlice
      
      const spins = 5; // Quay 5 vòng cho đẹp
      const baseRotation = currentRotation + (360 * spins);
      const remainder = baseRotation % 360;
      
      const targetRotation = baseRotation - remainder + (360 - targetSlice);
      
      currentRotation = targetRotation;
      
      // Áp dụng animation
      wheel.style.transform = `rotate(${currentRotation}deg)`;

      // Chờ animation kết thúc (5s)
      setTimeout(() => {
        showPrizeModal(data);
        isSpinning = false;
      }, 5000);

    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối. Vui lòng thử lại sau.');
      isSpinning = false;
    }
  });

  function showPrizeModal(data) {
    const icon = document.getElementById('prizeIcon');
    const title = document.getElementById('prizeTitle');
    const desc = document.getElementById('prizeDesc');
    const codeWrap = document.getElementById('prizeCodeWrap');
    const codeEl = document.getElementById('prizeCode');

    if (data.prizeType === 'empty') {
      icon.innerHTML = '<i class="bi bi-emoji-tear-fill"></i>';
      icon.className = 'w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg bg-slate-100 text-slate-400';
      title.textContent = 'Trượt rồi!';
      desc.textContent = data.message;
      codeWrap.classList.add('hidden');
    } else {
      icon.innerHTML = '<i class="bi bi-gift-fill"></i>';
      icon.className = 'w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg bg-brand-100 text-brand-500';
      title.textContent = 'Trúng thưởng!';
      desc.textContent = data.message;
      codeEl.textContent = data.voucher.code;
      codeWrap.classList.remove('hidden');

      // Bắn pháo bông
      if (typeof confetti !== 'undefined') {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899']
        });
      }
    }

    modal.classList.remove('opacity-0', 'invisible');
    setTimeout(() => {
      content.classList.remove('scale-90');
      content.classList.add('scale-100');
    }, 50);
  }

  function hidePrizeModal() {
    content.classList.remove('scale-100');
    content.classList.add('scale-90');
    setTimeout(() => {
      modal.classList.add('opacity-0', 'invisible');
    }, 300);
  }

  closeBtn.addEventListener('click', hidePrizeModal);
  backdrop.addEventListener('click', hidePrizeModal);
});
