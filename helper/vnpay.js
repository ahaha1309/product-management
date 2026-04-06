module.exports.sortObject= (obj)=> {
    let sorted = {};
    let str = [];
    let key;

    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(key); // Giữ nguyên key gốc, không encode
        }
    }

    str.sort(); // Sắp xếp alphabet theo key gốc

    for (let i = 0; i < str.length; i++) {
        const originalKey = str[i];
        const encodedKey = encodeURIComponent(originalKey);
        sorted[encodedKey] = encodeURIComponent(obj[originalKey]).replace(/%20/g, "+");
    }

    return sorted;
}