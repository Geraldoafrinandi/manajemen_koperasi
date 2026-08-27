import api from './api';

class CategoryService {
  async getAll() {
    const res = await api.get('/categories');
    return res.data || res;
  }

  async getById(id) {
    const res = await api.get(`/categories/${id}`);
    return res.data || res;
  }

  async create(categoryData) {
    const res = await api.post('/categories', categoryData);
    return res.data || res;
  }

  async update(id, categoryData) {
    const res = await api.put(`/categories/${id}`, categoryData);
    return res.data || res;
  }

  async delete(id) {
    const res = await api.delete(`/categories/${id}`);
    return res.data || res;
  }
}

export const categoryService = new CategoryService();
export default categoryService;
