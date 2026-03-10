document.addEventListener(
  'DOMContentLoaded',
  function () {
    const btn = document.querySelectorAll('.btn-outline-success');
    btn.forEach((button) => {
      button.onclick = function () {
        const status = button.getAttribute('button-status');
        let url = new URL(window.location.href);
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
      let url = new URL(window.location.href);
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
        let url = new URL(window.location.href);
        url.searchParams.set('page', currentPage);
        window.location.href = url.href;
      };
    });
    //Thay đổi trạng thái sản phẩm
  },
  false
);
