const test = require('node:test');
const assert = require('node:assert/strict');
const { validateProduct, validateMovement } = require('../src/stock');

test('normalizes a valid product', () => assert.deepEqual(validateProduct({
    sku: ' pen-01 ',
    name: 'Bút bi xanh',
    quantity: 12,
    minStock: 3
}).value, {
    sku: 'PEN-01',
    name: 'Bút bi xanh',
    quantity: 12,
    minStock: 3
}));

test('rejects invalid quantity', () => assert.match(validateProduct({
    sku: 'PEN-01',
    name: 'Bút',
    quantity: -1,
    minStock: 0
}).error, /không âm/));

test('prevents negative stock', () => assert.match(validateMovement({
    type: 'OUT',
    quantity: 6
}, 5).error, /không âm/));

