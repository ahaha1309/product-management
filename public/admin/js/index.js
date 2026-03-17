document.addEventListener(
  'DOMContentLoaded',
  function () {
    const btn = document.querySelectorAll('.btn-outline-success');
    const url = new URL(window.location.href);
    btn.forEach((button) => {
      button.onclick = function () {
        const status = button.getAttribute('button-status');
        if (status) {
          url.searchParams.set('status', status);
        } else {
          url.searchParams.delete('status');
        }
        window.location.href = url.href;
      };
    });
    //end button status(Tất cả,...)
    const formSearch = document.querySelector('#form-search');
    if (formSearch) {
      formSearch.addEventListener('submit', (e) => {
        e.preventDefault();
        const keyword = e.target.elements.keyword.value;
        if (keyword) {
          url.searchParams.set('keyword', keyword);
        } else {
          url.searchParams.delete('keyword');
        }
        window.location.href = url.href;
      });
    }
    // end form search
    //phân trang
    const page = document.querySelectorAll('.pagination li a');
    page.forEach((page) => {
      page.onclick = function () {
        const currentPage = page.getAttribute('button-pagination');
        url.searchParams.set('page', currentPage);
        window.location.href = url.href;
      };
    });
    //sắp xếp
    const btnSort = document.querySelector('[sort-clear]');
    const typeSort = document.querySelector("[name='sort']");
    if (typeSort) {
      typeSort.addEventListener('change', () => {
        const [sortKey, value] = typeSort.value.split('-');
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
    //upload image
    const uploadImage = document.querySelector('[upload-image]');
    if (uploadImage) {
      const inputImg = document.querySelector('[upload-image-input]');
      const imgPreview = document.querySelector('[upload-image-preview]');
      const btnClose = document.querySelector('[close-image-upload]');
      inputImg.addEventListener('change', (e) => {
        btnClose.classList.remove('d-none');
        const file = e.target.files[0];
        if (file) {
          imgPreview.classList.remove('d-none');
          imgPreview.src = URL.createObjectURL(file);
        }
        btnClose.addEventListener('click', (e) => {
          e.preventDefault();
          imgPreview.src = '';
          inputImg.value = '';
          btnClose.classList.add('d-none');
          imgPreview.classList.add('d-none');
        });
      });
    }

    //Thêm selected cho option
    const options = document.querySelectorAll('[option-select');
    const sortKey = url.searchParams.get('sortKey');
    const value = url.searchParams.get('value');
    if (sortKey && value) {
      options.forEach((option) => {
        const select = sortKey + '-' + value;
        if (option.value == select) {
          option.selected = true;
        }
      });
    }

  },
  false
);
