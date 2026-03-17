//permission
const tablePermission = document.querySelector('[id="table-permission"]');
if (tablePermission) {
  const btnSubmit = document.querySelector('button[type="submit"]');
  btnSubmit.addEventListener('click', async function (e) {
    e.preventDefault();
    const rows = tablePermission.querySelectorAll('tr[data-name]');
    let permissions = [];
    rows.forEach((row) => {
      const inputs = row.querySelectorAll('input');
      const name = row.getAttribute('data-name');
      if (name == 'id') {
       inputs.forEach((input) => {
          const roleId = input.value;
          permissions.push({
            roleId: roleId,
            permissions: [],
          });
      });
     } else{
        inputs.forEach((input,index) => {
          const checked=input.checked;
          if(checked){
          permissions[index].permissions.push(name);
          }
      });
     }
    });
    if(permissions.length>0){
    const form=document.querySelector('#form-permission');
    const inputPermissions = document.querySelector('#input-permissions');
    inputPermissions.value = JSON.stringify(permissions);
    form.submit();
    } else{
        alert('Vui lòng chọn ít nhất một quyền cho một nhóm!');
    }
  })
}
//end permission
