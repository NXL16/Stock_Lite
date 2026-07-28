require('dotenv').config();
const cors = require('cors');
const express = require('express');
const { pool } = require('./db');
const { register, observeRequest } = require('./metrics');
const { validateProduct, validateMovement } = require('./stock');
const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => observeRequest(req, res, startedAt));
    next();
});

app.get('/api/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'ok',
            service: 'stocklite-api'
        });
    } catch {
        res.status(503).json({
            status: 'error',
            message: 'Database unavailable'
        });
    }
});

app.get('/api/products', async (_req, res, next) => {
    try {
        res.json((await pool.query('SELECT * FROM products ORDER BY id DESC')).rows);
    } catch (error) {
        next(error);
    }
});

app.get('/api/products/:id', async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
        if (!result.rowCount) return res.status(404).json({
            message: 'Không tìm thấy sản phẩm.'
        });
        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

app.post('/api/products', async (req, res, next) => {
    const valid = validateProduct(req.body);
    if (valid.error) return res.status(400).json({ message: valid.error });
    const { sku, name, quantity, minStock } = valid.value;
    try {
        const result = await pool.query('INSERT INTO products (sku,name,quantity,min_stock) VALUES ($1,$2,$3,$4) RETURNING *', [sku, name, quantity, minStock]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error)
    }
});

app.put('/api/products/:id', async (req, res, next) => {
    const valid = validateProduct(req.body);
    if (valid.error) return res.status(400).json({
        message: valid.error
    });
    const { sku, name, quantity, minStock } = valid.value;
    try {
        const result = await pool.query('UPDATE products SET sku=$1,name=$2,quantity=$3,min_stock=$4,updated_at=NOW() WHERE id=$5 RETURNING *', [sku, name, quantity, minStock, req.params.id]);
        if (!result.rowCount) return res.status(404).json({
            message: 'Không tìm thấy sản phẩm.'
        });
        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

app.delete('/api/products/:id', async (req, res, next) => {
    try {
        const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [req.params.id]);
        if (!result.rowCount) return res.status(404).json({
            message: 'Không tìm thấy sản phẩm.'
        });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

app.get('/api/products/:id/movements', async (req, res, next) => {
    try {
        res.json((await pool.query('SELECT * FROM stock_movements WHERE product_id=$1 ORDER BY created_at DESC,id DESC', [req.params.id])).rows);
    } catch (error) {
        next(error);
    }
});

app.post('/api/products/:id/movements', async (req, res, next) => {
    const db = await pool.connect();
    try {
        await db.query('BEGIN');
        const result = await db.query('SELECT * FROM products WHERE id=$1 FOR UPDATE', [req.params.id]);
        if (!result.rowCount) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        }

        const product = result.rows[0];
        const valid = validateMovement(req.body, product.quantity);
        if (valid.error) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: valid.error });
        }

        const { type, quantity, note } = valid.value;
        const newQuantity = type === 'IN' ? product.quantity + quantity : product.quantity - quantity;
        await db.query('INSERT INTO stock_movements (product_id,type,quantity,note) VALUES ($1,$2,$3,$4)', [product.id, type, quantity, note]);
        const updated = await db.query('UPDATE products SET quantity=$1,updated_at=NOW() WHERE id=$2 RETURNING *', [newQuantity, product.id]);
        await db.query('COMMIT');
        res.status(201).json(updated.rows[0]);
    } catch (error) {
        await db.query('ROLLBACK'); next(error);
    } finally {
        db.release();
    }
});

app.get('/api/dashboard/low-stock', async (_req, res, next) => {
    try {
        res.json((await pool.query('SELECT * FROM products WHERE quantity <= min_stock ORDER BY quantity,name')).rows);
    } catch (error) {
        next(error);
    }
});

app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.use((error, _req, res, _next) => {
    if (error.code === '23505') return res.status(409).json({ message: 'SKU đã tồn tại.' });
    console.error(error);
    res.status(500).json({
        message: 'Đã xảy ra lỗi máy chủ.'
    });
});

const port = Number(process.env.PORT || 5002);
const listenHosts = (process.env.LISTEN_HOSTS || '127.0.0.1')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);

if (require.main === module) {
    listenHosts.forEach((host) => app.listen(port, host, () =>
        console.log(`StockLite API listening at http://${host}:${port}`)
    ));
}

module.exports = { app };
