import { useEffect, useState } from 'react';

const emptyProduct = { sku: '', name: '', quantity: 0, minStock: 0 };

async function api(path, options) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || 'Yêu cầu thất bại');
  return body;
}

function Field({ label, hint, children }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [movement, setMovement] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [all, low] = await Promise.all([api('/api/products'), api('/api/dashboard/low-stock')]);
      setProducts(all); setLowStock(low); setMessage('');
    } catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submitProduct = async (event) => {
    event.preventDefault();
    try {
      await api(editingId ? `/api/products/${editingId}` : '/api/products', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify({ ...form, quantity: Number(form.quantity), minStock: Number(form.minStock) })
      });
      setForm(emptyProduct); setEditingId(null); await load();
    } catch (error) { setMessage(error.message); }
  };

  const edit = (product) => {
    setEditingId(product.id);
    setForm({ sku: product.sku, name: product.name, quantity: product.quantity, minStock: product.min_stock });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (product) => {
    if (!confirm(`Bạn muốn xóa “${product.name}” chứ?`)) return;
    try { await api(`/api/products/${product.id}`, { method: 'DELETE' }); await load(); }
    catch (error) { setMessage(error.message); }
  };

  const submitMovement = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await api(`/api/products/${movement.id}/movements`, {
        method: 'POST',
        body: JSON.stringify({ type: data.get('type'), quantity: Number(data.get('quantity')), note: data.get('note') })
      });
      setMovement(null); await load();
    } catch (error) { setMessage(error.message); }
  };

  return <main>
    <header className="hero">
      <div><p className="eyebrow">QUẢN LÝ KHO</p><h1>StockLite</h1><p>Theo dõi sản phẩm và số lượng tồn kho trong một nơi.</p></div>
      <button className="secondary refresh" onClick={load}>↻ Làm mới dữ liệu</button>
    </header>

    {message && <div className="notice"><strong>Có lỗi:</strong> {message}</div>}

    <section className="summary" aria-label="Tổng quan tồn kho">
      <div><span className="stat-icon blue">▣</span><p><strong>{products.length}</strong><span>Sản phẩm</span></p></div>
      <div><span className="stat-icon orange">!</span><p><strong>{lowStock.length}</strong><span>Sắp hết hàng</span></p></div>
      <div><span className="stat-icon green">↗</span><p><strong>{products.reduce((sum, product) => sum + product.quantity, 0)}</strong><span>Tổng số lượng tồn</span></p></div>
    </section>

    <section className="workspace">
      <form className="card product-form" onSubmit={submitProduct}>
        <div className="section-heading"><div><p className="eyebrow">{editingId ? 'CHỈNH SỬA' : 'SẢN PHẨM MỚI'}</p><h2>{editingId ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}</h2></div>{editingId && <button type="button" className="text-button" onClick={() => { setEditingId(null); setForm(emptyProduct); }}>Hủy chỉnh sửa</button>}</div>
        <Field label="Mã sản phẩm (SKU)" hint="Ví dụ: PEN-01"><input required value={form.sku} onChange={event => setForm({ ...form, sku: event.target.value })} placeholder="Nhập mã sản phẩm" /></Field>
        <Field label="Tên sản phẩm"><input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Ví dụ: Bút bi xanh" /></Field>
        <div className="number-fields"><Field label="Số lượng hiện có"><input required min="0" type="number" value={form.quantity} onChange={event => setForm({ ...form, quantity: event.target.value })} /></Field><Field label="Báo tồn thấp khi còn"><input required min="0" type="number" value={form.minStock} onChange={event => setForm({ ...form, minStock: event.target.value })} /></Field></div>
        <button className="primary-submit">{editingId ? '✓ Lưu thay đổi' : '+ Thêm sản phẩm'}</button>
      </form>

      <aside className="card guide"><p className="eyebrow">CÁCH DÙNG NHANH</p><h2>Ba bước đơn giản</h2><ol><li><b>Thêm</b> sản phẩm vào danh sách.</li><li>Nhấn <b>Nhập / xuất kho</b> khi số lượng thay đổi.</li><li>Kiểm tra nhãn <b>Sắp hết</b> để nhập thêm hàng.</li></ol></aside>
    </section>

    <section className="card product-list">
      <div className="section-heading"><div><p className="eyebrow">DANH SÁCH</p><h2>Sản phẩm trong kho</h2></div><span className="product-count">{products.length} sản phẩm</span></div>
      {loading ? <p className="empty">Đang tải dữ liệu…</p> : !products.length ? <div className="empty"><strong>Kho đang trống</strong><span>Hãy thêm sản phẩm đầu tiên ở biểu mẫu phía trên.</span></div> : <div className="table-wrap"><table><thead><tr><th>Sản phẩm</th><th>Tồn kho</th><th>Ngưỡng</th><th>Trạng thái</th><th></th></tr></thead><tbody>{products.map(product => {
        const low = product.quantity <= product.min_stock;
        return <tr key={product.id}><td><strong>{product.name}</strong><small>{product.sku}</small></td><td><strong className="quantity">{product.quantity}</strong></td><td>{product.min_stock}</td><td><span className={low ? 'badge low' : 'badge'}>{low ? 'Sắp hết hàng' : 'Đủ hàng'}</span></td><td className="actions"><button onClick={() => setMovement(product)}>Nhập / xuất</button><button className="icon-button" title="Sửa" onClick={() => edit(product)}>✎</button><button className="icon-button danger" title="Xóa" onClick={() => remove(product)}>×</button></td></tr>;
      })}</tbody></table></div>}
    </section>

    {movement && <div className="modal-backdrop"><form className="modal" onSubmit={submitMovement}><button type="button" className="close" onClick={() => setMovement(null)}>×</button><p className="eyebrow">CẬP NHẬT TỒN KHO</p><h2>{movement.name}</h2><p className="current-stock">Đang có: <strong>{movement.quantity}</strong> sản phẩm</p><Field label="Bạn muốn làm gì?"><select name="type"><option value="IN">Nhập thêm vào kho</option><option value="OUT">Xuất hàng khỏi kho</option></select></Field><Field label="Số lượng"><input required autoFocus min="1" type="number" name="quantity" placeholder="Ví dụ: 10" /></Field><Field label="Ghi chú (không bắt buộc)"><input name="note" placeholder="Ví dụ: Nhập từ nhà cung cấp" /></Field><button className="primary-submit">Lưu cập nhật kho</button></form></div>}
  </main>;
}
