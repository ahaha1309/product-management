module.exports = (query, countProduct) => {
  let objectPanigation = {
    limit: 4,
    currentPage:1,
  };
  if (query.page) {
    objectPanigation.currentPage = parseInt(query.page);
    objectPanigation.skip = (objectPanigation.currentPage - 1) * objectPanigation.limit;
  }
  const totalPage = Math.ceil(countProduct / objectPanigation.limit);
  objectPanigation.totalPage = totalPage;
  return objectPanigation;
};
