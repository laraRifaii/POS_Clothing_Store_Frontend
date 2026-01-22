// src/renderer/pages/ReportsPage.tsx
import React, { useState, useEffect } from 'react';
import { saleApi, Sale, SalesReport } from '../services/api/sale.api';
import BackButton from '../components/backButton';
import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';

export const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'sales'>('overview');

  useEffect(() => {
    fetchReport();
    fetchRecentSales();
  }, [startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await saleApi.getReport(startDate, endDate);
      setReport(response);
    } catch (error: any) {
      console.error('Error fetching report:', error);
      toast.error(error.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSales = async () => {
    try {
      const response = await saleApi.getAll({
        startDate,
        endDate,
        limit: 50,
      });
      setRecentSales(response.sales);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const setPresetRange = (days: number) => {
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex  items-center ">
            <BackButton className="mr-4" />

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {' '}
                Sales Reports
              </h1>
              <p className="text-gray-600 mt-1">
                View sales analytics and insights
              </p>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-50">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 min-w-50">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPresetRange(7)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setPresetRange(30)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setPresetRange(90)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Last 90 Days
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 border-b-2 transition ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-2 border-b-2 transition ${
                activeTab === 'sales'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Sales History
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            {activeTab === 'overview' && report && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <DollarSign className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Total Revenue
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          ${report.totalRevenue.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <ShoppingBag className="text-green-600" size={24} />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Total Sales</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {report.totalSales}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <TrendingUp className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Avg Sale Value
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          $
                          {report.totalSales > 0
                            ? (report.totalRevenue / report.totalSales).toFixed(
                                2,
                              )
                            : '0.00'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">
                    Payment Method Breakdown
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {report.paymentBreakdown.map((payment) => (
                      <div
                        key={payment.paymentType}
                        className="border rounded-lg p-4"
                      >
                        <div className="text-sm text-gray-600 mb-1">
                          {payment.paymentType}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          ${payment.total.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.count}{' '}
                          {payment.count === 1 ? 'transaction' : 'transactions'}
                        </div>
                        <div className="mt-2 text-sm text-blue-600">
                          {(
                            (payment.total / report.totalRevenue) *
                            100
                          ).toFixed(1)}
                          % of revenue
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Selling Products */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">
                    Top Selling Products
                  </h2>
                  {report.topSellingProducts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No sales data available
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                              Rank
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                              Product
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                              Category
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                              Quantity Sold
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                              Revenue
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.topSellingProducts.map((item, index) => (
                            <tr
                              key={item.product.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="py-3 px-4">
                                <span className="font-semibold text-gray-900">
                                  #{index + 1}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-gray-900">
                                  {item.product.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {item.product.sku}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {item.product.category}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold">
                                {item.quantitySold}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-green-600">
                                $
                                {(
                                  item.product.price * item.quantitySold
                                ).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Recent Sales</h2>
                  <div className="text-sm text-gray-600">
                    Total: {recentSales.length}{' '}
                    {recentSales.length === 1 ? 'sale' : 'sales'}
                  </div>
                </div>

                {recentSales.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    No sales found for the selected date range
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Cashier
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Items
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Payment
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {recentSales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              #{sale.id}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(sale.createdAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {sale.user.username}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {sale.items.length}{' '}
                              {sale.items.length === 1 ? 'item' : 'items'}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {sale.paymentType}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                              ${sale.total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
