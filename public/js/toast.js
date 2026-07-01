document.addEventListener('DOMContentLoaded', () => {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('nvh-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'nvh-toast-container';
    toastContainer.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none';
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.setAttribute('role', 'status');
    document.body.appendChild(toastContainer);
  }

  const icons = {
    success: '<i class="bi bi-check-circle-fill text-emerald-500 text-xl"></i>',
    error: '<i class="bi bi-exclamation-triangle-fill text-rose-500 text-xl"></i>',
    info: '<i class="bi bi-info-circle-fill text-blue-500 text-xl"></i>',
    warning: '<i class="bi bi-exclamation-circle-fill text-amber-500 text-xl"></i>'
  };

  // Global event listener for toasts
  window.addEventListener('nvh:toast', (e) => {
    const { type = 'info', message, duration = 3000 } = e.detail;
    
    if (!message) return;

    const toast = document.createElement('div');
    toast.className = `
      flex items-center gap-3 p-4 bg-white/90 backdrop-blur-md border border-white 
      rounded-2xl shadow-xl shadow-surface-900/10 pointer-events-auto
      transform transition-all duration-300 ease-out translate-x-full opacity-0
    `;

    toast.innerHTML = `
      <div class="flex-shrink-0">${icons[type] || icons.info}</div>
      <div class="flex-1 text-sm font-bold text-surface-700 min-w-[200px]">${message}</div>
      <button class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-100 text-surface-400 transition-colors" onclick="this.parentElement.remove()">
        <i class="bi bi-x"></i>
      </button>
    `;

    toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
    });

    // Auto dismiss
    setTimeout(() => {
      toast.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => {
        if (toastContainer.contains(toast)) {
          toast.remove();
        }
      }, 300); // Wait for transition
    }, duration);
  });

  // Intercept and parse native req.flash embedded messages if they exist
  const serverAlerts = document.querySelectorAll('[data-server-alert]');
  serverAlerts.forEach(alert => {
    const type = alert.getAttribute('data-type');
    const message = alert.getAttribute('data-message');
    if (message) {
      window.dispatchEvent(new CustomEvent('nvh:toast', { detail: { type, message } }));
    }
    alert.remove();
  });
});
