document.addEventListener('DOMContentLoaded', () => {
  const url = new URL(window.location.href);
  //sắp xếp
  const btnSort = document.querySelector('[sort-clear]');
  const typeSort = document.querySelector("[name='sort']");
  if (typeSort) {
    typeSort.addEventListener('change', () => {
      let sortKey='';
      let value='';
      if(typeSort.value.split('-')[0]!=''){
        [sortKey, value] = typeSort.value.split('-');
      }
      url.searchParams.set('sortKey', sortKey);
      url.searchParams.set('value', value);
      window.location.href = url.href;
    });
    //xóa sắp xếp
    btnSort.addEventListener('click', () => {
      url.searchParams.delete('sortKey');
      url.searchParams.delete('value');
      window.location.href = url.href;
    });
  }
  //hiển thị thông báo
  const alertElement = document.querySelector('[show-alert]');
  if (alertElement) {
    const time = alertElement.getAttribute('data-time') ?? 5000;
    setTimeout(() => {
      alertElement.classList.add('alert-hidden');
    }, time);
    const closeNote = document.querySelector('[close-note]');
    closeNote.addEventListener('click', () => {
      alertElement.classList.add('alert-hidden');
    });
  }

  // Scroll Reveal Animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      } else {
        entry.target.classList.remove('active');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
  });

  // Flash sale countdown timer
  const hEl = document.getElementById('h');
  const mEl = document.getElementById('m');
  const sEl = document.getElementById('s');
  
  if (hEl && mEl && sEl) {
    const updateTimer = () => {
      const now = new Date();
      // Đặt thời gian đếm ngược đến cuối ngày hôm nay (23:59:59)
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime();
      const distance = endOfDay - now.getTime();

      if (distance < 0) {
        hEl.innerText = '00';
        mEl.innerText = '00';
        sEl.innerText = '00';
        return;
      }

      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      hEl.innerText = h.toString().padStart(2, '0');
      mEl.innerText = m.toString().padStart(2, '0');
      sEl.innerText = s.toString().padStart(2, '0');
    };

    updateTimer(); // Initial call
    setInterval(updateTimer, 1000);
  }

  // Splash Screen Logic
  const splashScreen = document.getElementById('splash-screen');
  if (splashScreen) {
    const hideSplash = () => {
      splashScreen.classList.add('splash-hidden');
    };
    // Hide after 1.2s for a premium feel
    setTimeout(hideSplash, 1200);
  }

  // Back to top logic
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    });
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
