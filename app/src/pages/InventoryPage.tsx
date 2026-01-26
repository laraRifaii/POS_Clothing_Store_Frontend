// src/renderer/pages/InventoryPage.tsx
import React, { useState, useEffect } from 'react';
import {
  productApi,
  Product,
  CreateProductDto,
  UpdateProductDto,
} from '../services/api/product.api';
import BackButton from '../components/backButton';
import { Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-react';

import useAuth from '../hooks/useAuth';
import { UserRole } from '../types/auth.enum';
import { toast } from 'react-toastify';
import { showDeleteConfirmation } from '../components/DeleteConfirmationModal';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const itemsPerPage = 10;
  const { user, session, hasPermission } = useAuth();
  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    sku: '',
    category: '',
    size: '',
    color: '',
    costPrice: 0,
    salePrice: 0,
    stock: 0,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [searchTerm, selectedCategory, currentPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getAll({
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      if (response.total === 0) {
        toast.info(response.message);
      }
      setProducts(response.products);
      setTotalProducts(response.total);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error(error.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productApi.getCategories();
      setCategories(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productApi.update(
          editingProduct.id,
          formData as UpdateProductDto,
        );
        toast.success('Product updated successfully');
      } else {
        await productApi.create(formData);
        toast.success('Product created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      size: product.size,
      color: product.color,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      stock: product.stock,
    });
    setShowModal(true);
  };

  const handleDelete = (id: number, name: string) => {
    showDeleteConfirmation(
      `Delete "${name}"?`,
      async () => {
        try {
          await productApi.delete(id);
          toast.success('Product deleted successfully');
          fetchProducts();
        } catch (error: any) {
          console.error('Error deleting product:', error);
          toast.error(error.message || 'Failed to delete product');
        }
      },
      {
        onCancel: () => {
          // Optional: Any cleanup or logging when user cancels
          console.log('Delete cancelled');
        },
      },
    );
  };
  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      size: '',
      color: '',
      costPrice: 0,
      salePrice: 0,
      stock: 0,
    });
    setEditingProduct(null);
  };

  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  const generateSKU = () => {
    const prefix = formData.category
      ? formData.category.substring(0, 3).toUpperCase()
      : 'PRD';

    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);

    const sku = `${prefix}-${randomPart}-${timestamp}`;

    setFormData({ ...formData, sku });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4 ">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Inventory Management
              </h1>
              <p className="text-gray-600 mt-1">Manage your product catalog</p>
            </div>
          </div>
          {user?.role === UserRole.ADMIN ? (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition"
            >
              <Plus size={20} />
              Add Product
            </button>
          ) : (
            ''
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="text-right text-gray-600">
              Total Products:{' '}
              <span className="font-semibold">{totalProducts}</span>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No products found
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Color
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Stock
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sale Price
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cost Price
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {product.id}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.size}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.color}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded ${product.stock <= 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                        >
                          {product.stock}
                          {product.stock <= 10 && (
                            <AlertCircle size={14} className="inline ml-1" />
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ${product.salePrice.toFixed(2)}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ${product.costPrice.toFixed(2)}
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(product.id, product.name)
                            }
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, totalProducts)} of{' '}
                    {totalProducts}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          onMouseDown={() => setShowModal(false)}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-6">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>

                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="button"
                    onClick={generateSKU}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Generate SKU automatically
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    list="categories"
                  />
                  <datalist id="categories">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.size}
                    onChange={(e) =>
                      setFormData({ ...formData, size: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costPrice: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sale Price ($)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.salePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salePrice: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
