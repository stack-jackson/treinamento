CREATE COLLATION case_insensitive (
    provider = icu,
    locale = 'und-u-ks-level2',
    deterministic = false
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT COLLATE case_insensitive NOT NULL UNIQUE,
    tax_percent NUMERIC(5,2) NOT NULL CHECK (tax_percent BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT COLLATE case_insensitive NOT NULL UNIQUE,
    qty INTEGER NOT NULL CHECK (qty >= 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tax_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    qty INTEGER NOT NULL CHECK (qty > 0),
    unit_price NUMERIC(12,2) NOT NULL,
    tax_percent NUMERIC(5,2) NOT NULL,
    tax_amount NUMERIC(14,2) NOT NULL,
    line_subtotal NUMERIC(14,2) NOT NULL,
    line_total NUMERIC(14,2) NOT NULL
);

INSERT INTO categories(name, tax_percent) VALUES
('Categoria Standard',10.00),
('Categoria Premium',15.00);

INSERT INTO products(name, qty, unit_price, category_id)
SELECT 'Produto Branco',27,200.00,c.id FROM categories c WHERE c.name='Categoria Premium';

INSERT INTO products(name, qty, unit_price, category_id)
SELECT 'Produto Azul',104,150.00,c.id FROM categories c WHERE c.name='Categoria Standard';

INSERT INTO sales(tax_total, subtotal, total) VALUES
(105.00, 1050.00, 1155.00);

INSERT INTO sale_items(sale_id, product_id, name, qty, unit_price, tax_percent, tax_amount, line_subtotal, line_total) VALUES
(1, 2, 'Produto Azul', 7, 150.00, 10.00, 105.00, 1050.00, 1155.00);
