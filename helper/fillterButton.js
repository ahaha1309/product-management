module.exports = (query) => {
  let fillterButton = [
    {
      name: 'Tất cả',
      status: '',
      class: '',
    },
    {
      name: 'Hoạt động',
      status: 'active',
      class: '',
    },
    {
      name: 'Dừng hoạt động',
      status: 'inactive',
      class: '',
    },
  ];
  if (query.status) {
    const index = fillterButton.findIndex((item) => item.status == query.status);
    fillterButton[index].class = 'active';
  } else {
    const index = fillterButton.findIndex((item) => item.status == '');
    fillterButton[index].class = 'active';
  }
  return fillterButton;
};
