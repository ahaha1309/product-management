document.addEventListener('DOMContentLoaded',()=>{
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
})
