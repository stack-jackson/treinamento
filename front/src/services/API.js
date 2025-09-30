const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export const api = {
  // Categorias
  getCategories: () => fetch(`${API_BASE}/categories`).then(res => res.json()),
  createCategory: (data) => fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  deleteCategory: (id) => fetch(`${API_BASE}/categories`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  }).then(res => res.json()),

  // Produtos
  getProducts: () => fetch(`${API_BASE}/products`).then(res => res.json()),
  createProduct: (data) => fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  deleteProduct: (id) => fetch(`${API_BASE}/products`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  }).then(res => res.json()),

  // Carrinho
  getCart: () => fetch(`${API_BASE}/cart`).then(res => res.json()),
  addToCart: (data) => fetch(`${API_BASE}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  removeFromCart: (productId) => fetch(`${API_BASE}/cart`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId })
  }).then(res => res.json()),

  // Vendas
  getSales: () => fetch(`${API_BASE}/sales`).then(res => res.json()),
  getSaleDetails: (id) => fetch(`${API_BASE}/sales?id=${id}`).then(res => res.json()),
  createSale: (data) => fetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json())
};