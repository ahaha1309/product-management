const createTree = (categories, parentId = '',counter = { value: 0 }) => {     
    const tree = [];
    categories.forEach(category => {
      if (category.parent_id === parentId) {
        counter.value++;
        const newItem=category;
        newItem.count=counter.value;
        const children = createTree(categories, category.id, counter); 
        if (children.length > 0) {
          newItem.children = children;
        }
        tree.push(newItem);
      }
    });
    return tree;
  };
module.exports.createTree = createTree;
