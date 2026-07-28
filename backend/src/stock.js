function validateProduct(input) {
  const sku = String(input.sku || '').trim().toUpperCase();
  const name = String(input.name || '').trim();
  const quantity = Number(input.quantity);
  const minStock = Number(input.minStock);
  if (!/^[A-Z0-9-]{3,50}$/.test(sku)) return {
    error: 'SKU gồm 3-50 ký tự: chữ, số hoặc dấu gạch ngang.'
  };
  if (name.length < 2 || name.length > 120) return {
    error: 'Tên sản phẩm phải từ 2 đến 120 ký tự.'
  };
  if (!Number.isInteger(quantity) || quantity < 0) return {
    error: 'Số lượng phải là số nguyên không âm.'
  };
  if (!Number.isInteger(minStock) || minStock < 0) return {
    error: 'Ngưỡng tồn tối thiểu phải là số nguyên không âm.'
  };
  return {
    value: {
      sku, name, quantity, minStock
    }
  };
}
function validateMovement(input, currentQuantity) {
  const type = String(input.type || '').toUpperCase();
  const quantity = Number(input.quantity);
  const note = String(input.note || '').trim();
  if (!['IN', 'OUT'].includes(type)) return {
    error: 'Loại giao dịch chỉ có IN hoặc OUT.'
  };
  if (!Number.isInteger(quantity) || quantity <= 0) return {
    error: 'Số lượng giao dịch phải là số nguyên dương.'
  };
  if (type === 'OUT' && quantity > currentQuantity) return {
    error: 'Không thể xuất vượt số lượng tồn kho.'
  };
  return {
    value: {
      type, quantity, note
    }
  };
}
module.exports = { validateProduct, validateMovement };
