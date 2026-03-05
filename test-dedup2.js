const parsed2 = [
    { name: 'SKU 100', skuType: 'sku100' },
    { name: 'My Custom 1', skuType: 'standard' },
    { name: 'My Custom 2', skuType: 'standard' }
];

const seenTypes = new Set();
const out = parsed2.filter(s => {
    const key = s.skuType || 'standard';
    if (seenTypes.has(key)) return false;
    seenTypes.add(key);
    return true;
});
console.log(out);
