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
});
