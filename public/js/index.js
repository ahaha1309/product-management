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

  // Flash sale countdown timer logic has been moved directly to home/index.pug 
  // to avoid conflicting scripts and handle "days" accurately.

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

  // --------------------------------------------------------------------------
  // Social Proof Toasts (Fake Recent Sales)
  // --------------------------------------------------------------------------
  const socialProofNames = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Hoàng C', 'Phạm Minh D', 'Vũ Đức E', 'Bùi Ngọc F'];
  const socialProofProducts = ['iPhone 15 Pro Max', 'MacBook Air M2', 'AirPods Pro 2', 'Apple Watch Series 9', 'iPad Pro 11-inch', 'Samsung Galaxy S24 Ultra'];
  const socialProofTimes = ['vừa xong', '1 phút trước', '2 phút trước', '5 phút trước', '10 phút trước'];
  const socialProofLocations = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
  
  function showSocialProof() {
    // Only show on desktop for better UX
    if (window.innerWidth < 768) return;

    const name = socialProofNames[Math.floor(Math.random() * socialProofNames.length)];
    const product = socialProofProducts[Math.floor(Math.random() * socialProofProducts.length)];
    const time = socialProofTimes[Math.floor(Math.random() * socialProofTimes.length)];
    const location = socialProofLocations[Math.floor(Math.random() * socialProofLocations.length)];
    
    // Create container if not exists
    let container = document.getElementById('social-proof-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'social-proof-container';
      container.className = 'fixed bottom-24 left-6 z-40 flex flex-col gap-3 pointer-events-none';
      document.body.appendChild(container);
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = 'bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl shadow-brand-500/10 rounded-2xl p-3 flex items-center gap-3 transform translate-y-10 opacity-0 transition-all duration-500 w-80 pointer-events-auto';
    
    toast.innerHTML = `
      <div class="w-12 h-12 bg-gradient-to-tr from-brand-100 to-brand-50 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
        <i class="bi bi-bag-check-fill text-xl text-brand-500"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-xs text-surface-500 mb-0.5"><span class="font-bold text-surface-900">${name}</span> (từ ${location})</p>
        <p class="text-sm font-bold text-brand-600 truncate">Vừa mua ${product}</p>
        <p class="text-[10px] text-surface-400 mt-0.5"><i class="bi bi-clock-history mr-1"></i>${time}</p>
      </div>
      <button class="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-100 rounded-full flex items-center justify-center text-surface-400 hover:text-rose-500 shadow-sm" onclick="this.parentElement.remove()">
        <i class="bi bi-x text-sm"></i>
      </button>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-10', 'opacity-0');
    });

    // Remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('translate-y-10', 'opacity-0');
      setTimeout(() => {
        if (toast.parentElement) toast.remove();
      }, 500);
    }, 5000);
  }

  // Randomly show toast every 15-45 seconds
  setTimeout(function runSocialProof() {
    showSocialProof();
    setTimeout(runSocialProof, Math.random() * 30000 + 15000);
  }, Math.random() * 5000 + 5000); // initial delay 5-10s

});
