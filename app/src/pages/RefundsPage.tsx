// src/renderer/pages/RefundsPage.tsx
import React, { useState, useEffect } from 'react';
import { saleApi, Sale } from '../services/api/sale.api';
import { 
  refundApi, 
  Refund, 
  RefundType, 
  CreateRefundDto,
  CreateRefundItemDto 
} from '../services/api/refund.api';
import BackButton from '../components/backButton';
import { Search, RotateCcw, AlertCircle, Check, X } from 'lucide-react';
import { toast } from 'react-toastify';

interface RefundItemSelection {
  saleItemId: number;
  productName: string;
  originalQuantity: number;
  alreadyRefunded: number;
  availableToRefund: number;
  price: number;
  discount: number;
  selectedQuantity: number;
}

export const RefundsPage: React.FC = () => {
  const [saleId, setSaleId] = useState('');
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(false);
  const [refundItems, setRefundItems] = useState<RefundItemSelection[]>([]);
  const [refundType, setRefundType] = useState<RefundType>(RefundType.PARTIAL);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [recentRefunds, setRecentRefunds] = useState<Refund[]>([]);
  const [activeTab, setActiveTab] = useState<'process' | 'history'>('process');

  useEffect(() => {
    fetchRecentRefunds();
  }, []);

  const fetchRecentRefunds = async () => {
    try {
      const response = await refundApi.getAll({ limit: 20 });
      setRecentRefunds(response.refunds);
    } catch (error) {
      console.error('Error fetching refunds:', error);
    }
  };

  const searchSale = async () => {
    if (!saleId || saleId.trim() === '') {
      toast.error('Please enter a sale ID');
      return;
    }

    setLoading(true);
    try {
      const saleData = await saleApi.getById(parseInt(saleId));
      
      // Get existing refunds for this sale
      const existingRefunds = await refundApi.getBySaleId(saleData.id);
      
      // Calculate already refunded quantities
      const refundedMap = new Map<number, number>();
      existingRefunds.forEach(refund => {
        refund.items.forEach(item => {
          const current = refundedMap.get(item.saleItemId) || 0;
          refundedMap.set(item.saleItemId, current + item.quantity);
        });
      });

      // Build refund items selection
      const items: RefundItemSelection[] = saleData.items.map(item => {
        const alreadyRefunded = refundedMap.get(item.id) || 0;
        return {
          saleItemId: item.id,
          productName: item.product.name,
          originalQuantity: item.quantity,
          alreadyRefunded,
          availableToRefund: item.quantity - alreadyRefunded,
          price: item.price,
          discount: item.discount,
          selectedQuantity: 0,
        };
      });

      setSale(saleData);
      setRefundItems(items);
      setReason('');
      setNotes('');
    } catch (error: any) {
      console.error('Error fetching sale:', error);
      toast.error(error.message || 'Sale not found');
      setSale(null);
      setRefundItems([]);
    } finally {
      setLoading(false);
    }
  };

  const updateItemQuantity = (saleItemId: number, quantity: number) => {
    setRefundItems(items =>
      items.map(item =>
        item.saleItemId === saleItemId
          ? { ...item, selectedQuantity: Math.max(0, Math.min(quantity, item.availableToRefund)) }
          : item
      )
    );
  };

  const selectAll = () => {
    setRefundItems(items =>
      items.map(item => ({ ...item, selectedQuantity: item.availableToRefund }))
    );
    setRefundType(RefundType.FULL);
  };

  const clearSelection = () => {
    setRefundItems(items =>
      items.map(item => ({ ...item, selectedQuantity: 0 }))
    );
  };

  const calculateRefundTotal = () => {
    return refundItems.reduce((sum, item) => {
      return sum + ((item.price - item.discount) * item.selectedQuantity);
    }, 0);
  };

  const handleProcessRefund = async () => {
    if (!sale) return;

    const selectedItems = refundItems.filter(item => item.selectedQuantity > 0);

    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to refund');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }

    setShowConfirm(true);
  };

  const confirmRefund = async () => {
    if (!sale) return;

    const selectedItems = refundItems.filter(item => item.selectedQuantity > 0);

    const refundData: CreateRefundDto = {
      saleId: sale.id,
      refundType,
      reason: reason.trim(),
      notes: notes.trim() || undefined,
      items: selectedItems.map((item): CreateRefundItemDto => ({
        saleItemId: item.saleItemId,
        quantity: item.selectedQuantity,
        refundAmount: (item.price - item.discount) * item.selectedQuantity,
      })),
    };

    setLoading(true);
    try {
      await refundApi.create(refundData);
      toast.success('Refund processed successfully!');
      
      // Reset form
      setSale(null);
      setSaleId('');
      setRefundItems([]);
      setReason('');
      setNotes('');
      setShowConfirm(false);
      
      // Refresh refunds list
      fetchRecentRefunds();
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast.error(error.message || 'Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  const getRefundTypeBadge = (type: RefundType) => {
    const colors = {
      FULL: 'bg-red-100 text-red-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
      EXCHANGE: 'bg-blue-100 text-blue-800',
    };
    return colors[type];
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
    
      
      <div className="max-w-7xl mx-auto">
        <div className='flex gap-4'>
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Refunds & Returns</h1>

        </div>
        

        {/* Tabs */}
        <div className="mb-6 border-b">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('process')}
              className={`px-4 py-2 border-b-2 transition ${
                activeTab === 'process'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Process Refund
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 border-b-2 transition ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Refund History
            </button>
          </div>
        </div>

        {activeTab === 'process' ? (
          <div className="space-y-6">
            {/* Search Sale */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Find Sale</h2>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    placeholder="Enter Sale ID or Invoice Number"
                    value={saleId}
                    onChange={(e) => setSaleId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchSale()}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={searchSale}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {sale && (
              <>
                {/* Sale Details */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Sale Details</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Invoice #</div>
                      <div className="font-semibold">{sale.id}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Date</div>
                      <div className="font-semibold">{new Date(sale.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Cashier</div>
                      <div className="font-semibold">{sale.user.username}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total</div>
                      <div className="font-semibold text-green-600">${sale.total.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                {/* Refund Items Selection */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Select Items to Refund</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAll}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {refundItems.map(item => (
                      <div key={item.saleItemId} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{item.productName}</div>
                            <div className="text-sm text-gray-600">
                              Original: {item.originalQuantity} | 
                              Price: ${item.price.toFixed(2)} | 
                              {item.discount > 0 && ` Discount: $${item.discount.toFixed(2)}`}
                            </div>
                            {item.alreadyRefunded > 0 && (
                              <div className="text-sm text-orange-600 mt-1">
                                <AlertCircle size={14} className="inline mr-1" />
                                Already refunded: {item.alreadyRefunded}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Available to refund</div>
                            <div className="text-lg font-bold text-blue-600">{item.availableToRefund}</div>
                          </div>
                        </div>

                        {item.availableToRefund > 0 ? (
                          <div className="flex items-center gap-4">
                            <label className="text-sm text-gray-600">Quantity to refund:</label>
                            <input
                              type="number"
                              min="0"
                              max={item.availableToRefund}
                              value={item.selectedQuantity}
                              onChange={(e) => updateItemQuantity(item.saleItemId, parseInt(e.target.value) || 0)}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                            />
                            <div className="flex-1 text-right">
                              <span className="text-sm text-gray-600">Refund amount: </span>
                              <span className="font-bold text-lg">
                                ${((item.price - item.discount) * item.selectedQuantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-red-600">
                            <X size={14} className="inline mr-1" />
                            Fully refunded
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Refund Details */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Refund Details</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Refund Type</label>
                      <select
                        value={refundType}
                        onChange={(e) => setRefundType(e.target.value as RefundType)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={RefundType.FULL}>Full Refund</option>
                        <option value={RefundType.PARTIAL}>Partial Refund</option>
                        <option value={RefundType.EXCHANGE}>Exchange</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Defective product, Wrong size, Customer request"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional notes about this refund"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center text-2xl font-bold">
                        <span>Total Refund:</span>
                        <span className="text-red-600">${calculateRefundTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleProcessRefund}
                      disabled={loading || calculateRefundTotal() === 0}
                      className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={20} />
                      Process Refund
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Refund History */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Recent Refunds</h2>
            </div>
            
            {recentRefunds.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No refunds found
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed By</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentRefunds.map((refund) => (
                    <tr key={refund.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{refund.id}</td>
                      <td className="px-6 py-4 text-sm text-blue-600">#{refund.saleId}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(refund.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRefundTypeBadge(refund.refundType)}`}>
                          {refund.refundType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{refund.reason}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{refund.user.username}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-red-600">
                        -${refund.totalRefunded.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Confirm Refund</h2>
            
            <div className="mb-6 space-y-2">
              <p className="text-gray-700">
                You are about to process a <span className="font-semibold">{refundType}</span> refund of:
              </p>
              <div className="text-3xl font-bold text-red-600">
                ${calculateRefundTotal().toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">
                This action will return {refundItems.filter(i => i.selectedQuantity > 0).length} item(s) to inventory.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={confirmRefund}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition flex items-center justify-center gap-2"
              >
                <Check size={20} />
                {loading ? 'Processing...' : 'Confirm Refund'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};