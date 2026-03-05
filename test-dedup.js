const default110 = { name: 'SKU 110', skuType: 'sku110' };
const allDefaults = [default110];

let parsed = [
    { name: 'SKU 110 ', skuType: 'standard' },
    { name: 'SKU 110', skuType: 'sku110' }
];

const nameToExpectedType = {};
for (const def of allDefaults) {
    nameToExpectedType[def.name.toUpperCase().replace(/[^A-Z0-9]/g, '')] = def.skuType || 'standard';
}

console.log("nameToExpectedType:", nameToExpectedType);

parsed = parsed.filter(s => {
    const nameKey = s.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const expected = nameToExpectedType[nameKey];
    console.log("Filtering:", s.name, "nameKey:", nameKey, "expected:", expected, "s.skuType:", s.skuType);
    if (expected && s.skuType !== expected) return false;
    return true;
});

console.log("After drop stale:", parsed);

const seenTypes = new Set();
parsed = parsed.filter(s => {
    const key = s.skuType || 'standard';
    if (seenTypes.has(key)) return false;
    seenTypes.add(key);
    return true;
});

console.log("After dedup type:", parsed);

const seenNames = new Set();
parsed = parsed.filter(s => {
    const key = s.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
});

console.log("After dedup name:", parsed);

for (const def of allDefaults) {
    if (!parsed.find(s => s.skuType === def.skuType)) {
        parsed.push(def);
    }
}

console.log("Final:", parsed);

