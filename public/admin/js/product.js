document.addEventListener("DOMContentLoaded", () => {
//thây đổi trạng thái sản phảm
const buttonChangeStatus = document.querySelectorAll('[button-change-status]');
if (buttonChangeStatus.length > 0) {
  buttonChangeStatus.forEach((button) => {
    button.addEventListener('click', () => {
      const formStatus = document.querySelector('#form-change-status');
      const path = formStatus.getAttribute('data-path');
      const statusCurrent = button.getAttribute('data-status');
      let statusChange = statusCurrent == 'active' ? 'inactive' : 'active';
      let id = button.getAttribute('button-id');
      const action = path + `/${statusChange}/${id}` + '?_method=PATCH';
      formStatus.action = action;
      formStatus.submit();
    });
  });
}
//hoạt động của sản phẩm
const buttonChangeActivity = document.querySelectorAll('[button-change-activity]');
const formActivity = document.querySelector('#form-change-activity');
if (formActivity) {
  const path = formActivity.getAttribute('data-path');
  if (buttonChangeActivity.length > 0) {
    buttonChangeActivity.forEach((button) => {
      button.addEventListener('click', () => {
        const activity = button.getAttribute('button-change-activity');
        const id = button.getAttribute('btn-id');
        if (activity == 'delete') {
          confirm('Bạn có chắc chắn muốn xóa sản phẩm này?') &&
            (() => {
              const action = path + `/${activity}/${id}` + '?_method=PATCH';
              formActivity.action = action;
              formActivity.submit();
            })();
        }
      });
    });
  }
}
//thay đổi nhiều sản phẩm
const checkAll = document.querySelector('[name="checkall"]');
const multiStatus = document.querySelectorAll('[multi-status]');
const inputId = document.querySelector('[input-ids]');
if (checkAll) {
  checkAll.addEventListener('change', () => {
    if (checkAll.checked) {
      multiStatus.forEach((button) => {
        button.checked = true;
        const id = button.value ?? '';
        inputId.value += id + ',';
      });
    } else {
      multiStatus.forEach((button) => {
        button.checked = false;
        const id = button.value ?? '';
        inputId.value = inputId.value.replace(id + ',', '');
      });
    }
  });
}
if (multiStatus.length > 0) {
  multiStatus.forEach((button) => {
    button.addEventListener('change', () => {
      const id = button.value ?? '';
      if (button.checked) {
        inputId.value += id + ',';
        inputId.value.split(',').filter((id) => id).length == multiStatus.length
          ? (checkAll.checked = true)
          : (checkAll.checked = false);
      } else {
        const ids = inputId.value.split(',').filter((id) => id && id != button.value);
        inputId.value = ids.join(',') + (ids.length > 0 ? ',' : '');
        checkAll.checked = false;
      }
    });
  });
}
const formChangeMulti = document.querySelector('[form-change-multi]');
if (formChangeMulti) {
  formChangeMulti.addEventListener('submit', (e) => {
    const multiStatusChecked = document.querySelectorAll('[multi-status]:checked');
    const type = formChangeMulti.querySelector('select[name="type"]').value;
    if (type == 'delete') {
      e.preventDefault();
      confirm('Bạn có chắc chắn muốn xóa các sản phẩm đã chọn?') && formChangeMulti.submit();
    }
    if (type == 'position' && multiStatusChecked.length > 0) {
      e.preventDefault();
      inputId.value = '';
      multiStatusChecked.forEach((button) => {
        const id = button.value ?? '';
        const positionInput = button.closest('tr').querySelector('input[name="position"]').value;
        inputId.value += id + ':' + positionInput + ',';
      });
      formChangeMulti.submit();
    }
    if (multiStatusChecked.length == 0) {
      e.preventDefault();
      alert('Vui lòng chọn ít nhất một sản phẩm');
    }
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