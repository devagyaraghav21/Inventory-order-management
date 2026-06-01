import api from './axiosClient'

export const productsApi = {
  getAll: (params) => api.get('/products/', { params }).then(r => r.data),
  getById: (id) => api.get(`/products/${id}`).then(r => r.data),
  create: (data) => api.post('/products/', data).then(r => r.data),
  update: (id, data) => api.put(`/products/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: (threshold = 10) => api.get('/products/low-stock', { params: { threshold } }).then(r => r.data),
  getCategories: () => api.get('/products/categories').then(r => r.data),
}
