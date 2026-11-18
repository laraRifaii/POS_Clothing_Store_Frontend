import React, { useState, useEffect, useRef } from 'react';
import { productApi, Product } from '../services/api/product.api';
import {
  saleApi,
  PaymentType,
  CreateSaleDto,
  CreateSaleItemDto,
  Sale,
} from '../services/api/sale.api';
import { invoiceService } from '../services/invoice/invoice.service';
import { BarcodeScannerIndicator } from '../components/BarcodeScannerIndicator';
import BackButton from '../components/backButton';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  DollarSign,
  Printer,
  Download,
} from 'lucide-react';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { toast } from 'react-toastify';
import { showConfirmModal } from '../components/SaleConfirmationModal';

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export const SalesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.CASH);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isPageActive, setIsPageActive] = useState(true);
  const audioRef = useRef<{ success: HTMLAudioElement; error: HTMLAudioElement } | null>(null);

  useEffect(() => {
    audioRef.current = {
      success: new Audio('/sounds/beep.mp3'),
      error: new Audio('/sounds/error.mp3'),
    };
  }, []);

  useEffect(() => {
    setIsPageActive(!showInvoiceModal);
  }, [showInvoiceModal]);

  const { reset: resetScanner } = useBarcodeScanner({
    onScan: async (barcode) => {
      
      try {
        const product = await productApi.getBySku(barcode);
        addToCart(product);
        
        audioRef.current?.success.play().catch(() => {});
        
        toast.success(`Added: ${product.name}`, {
          position: 'top-right',
          autoClose: 2000,
        });
      } catch (error: any) {
        console.error('❌ Product not found:', barcode);
        
        audioRef.current?.error.play().catch(() => {});
        
        toast.error(`Product not found: ${barcode}`, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    },
    minLength: 3,
    scanTimeout: 50,
    enabled: scannerEnabled,
    pageActive: isPageActive,
  });

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchProducts();
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchTerm]);

  const searchProducts = async () => {
    try {
      const response = await productApi.getAll({
        search: searchTerm,
        isActive: true,
        limit: 10,
      });
      setSearchResults(response.products);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error(`Insufficient stock. Only ${product.stock} available.`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      if (product.stock === 0) {
        toast.error('Product out of stock');
        return;
      }
      setCart([...cart, { product, quantity: 1, discount: 0 }]);
    }

    setSearchTerm('');
    setShowSearchResults(false);
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > item.product.stock) {
      toast.error(`Insufficient stock. Only ${item.product.stock} available.`);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item,
      ),
    );
  };

  const updateItemDiscount = (productId: number, discount: number) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              discount: Math.max(0, Math.min(discount, item.product.salePrice)),
            }
          : item,
      ),
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const itemPrice = (item.product.salePrice - item.discount) * item.quantity;
      return sum + itemPrice;
    }, 0);
  };

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() - discount);
  };

  const openCashDrawer = async () => {
    try {
      if (window.electron?.cashDrawer) {
        await window.electron.cashDrawer.open();
      }
    } catch (error) {
      console.error('Cash drawer error:', error);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    showConfirmModal(
      `Process sale of $${calculateTotal().toFixed(2)}?`,
      async () => {
        setLoading(true);
        try {
          const saleData: CreateSaleDto = {
            items: cart.map(
              (item): CreateSaleItemDto => ({
                productId: item.product.id,
                quantity: item.quantity,
                price: item.product.salePrice,
                discount: item.discount,
              }),
            ),
            paymentType,
            discount,
          };

          const response = await saleApi.create(saleData);

          if (paymentType === PaymentType.CASH) {
            await openCashDrawer();
          }

          setLastSale(response);
          setShowInvoiceModal(true);

          setCart([]);
          setDiscount(0);
          setPaymentType(PaymentType.CASH);
          
          audioRef.current?.success.play().catch(() => {});
        } catch (error: any) {
          console.error('Error processing sale:', error);
          toast.error(error.message || 'Failed to process sale');
          audioRef.current?.error.play().catch(() => {});
        } finally {
          setLoading(false);
        }
      },
      {
        onCancel: () => {
          toast.info('Sale cancelled');
        }
      }
    );
  };

  const handlePrintInvoice = async () => {
    if (!lastSale) return;
    try {
      await invoiceService.print(lastSale);
      toast.success('Invoice sent to printer');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print invoice');
    }
  };

  const handleDownloadInvoice = () => {
    if (!lastSale) return;
    try {
      invoiceService.download(lastSale);
      toast.success('Invoice downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download invoice');
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-4">
            <BackButton />
            <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              scannerEnabled && isPageActive 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {scannerEnabled && isPageActive ? '🟢 Scanner Active' : '🔴 Scanner Off'}
            </div>
            <button
              onClick={() => setScannerEnabled(!scannerEnabled)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
            >
              {scannerEnabled ? 'Disable' : 'Enable'} Scanner
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Add Products</h2>

            <div className="relative mb-6">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                id="product-search"
                type="text"
                placeholder="Search by name, SKU, or scan barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent barcode-input"
                autoComplete="off"
              />

              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            SKU: {product.sku} | {product.category} |{' '}
                            {product.size} | {product.color}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-blue-600">
                            ${product.salePrice.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Cost: ${product.costPrice.toFixed(2)}
                          </div>
                          <div
                            className={`text-sm ${product.stock <= 10 ? 'text-red-600' : 'text-green-600'}`}
                          >
                            Stock: {product.stock}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">
                Cart Items ({cart.length})
              </h3>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart size={48} className="mx-auto mb-4" />
                  <p>Cart is empty. Search and add products to start a sale.</p>
                  <p className="text-sm mt-2">💡 Scan barcodes to add products quickly</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {item.product.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.product.category} | {item.product.size} |{' '}
                            {item.product.color}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">
                            Quantity
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity - 1,
                                )
                              }
                              className="min-w-[44px] min-h-[44px] p-2 border rounded hover:bg-gray-100 active:bg-gray-200"
                            >
                              <Minus size={16} />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={item.product.stock}
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(
                                  item.product.id,
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="w-16 text-center border rounded px-2 py-2 min-h-[44px]"
                            />
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity + 1,
                                )
                              }
                              className="min-w-[44px] min-h-[44px] p-2 border rounded hover:bg-gray-100 active:bg-gray-200"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-gray-600 block mb-1">
                            Sale Price
                          </label>
                          <div className="font-semibold py-2">
                            ${item.product.salePrice.toFixed(2)}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-gray-600 block mb-1">
                            Discount ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={item.product.salePrice}
                            step="0.01"
                            value={item.discount}
                            onChange={(e) =>
                              updateItemDiscount(
                                item.product.id,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full border rounded px-2 py-2 min-h-11"
                          />
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t flex justify-between items-center">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="font-bold text-lg">
                          $
                          {(
                            (item.product.salePrice - item.discount) *
                            item.quantity
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 h-fit sticky top-8">
            <h2 className="text-xl font-semibold mb-6">Checkout</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-semibold">
                  ${calculateSubtotal().toFixed(2)}
                </span>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Sale Discount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  max={calculateSubtotal()}
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 min-h-[44px]"
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Payment Method
              </label>
              <div className="space-y-2">
                {Object.values(PaymentType).map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-3 cursor-pointer min-h-[44px] p-2 rounded hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      value={type}
                      checked={paymentType === type}
                      onChange={(e) =>
                        setPaymentType(e.target.value as PaymentType)
                      }
                      className="w-5 h-5"
                    />
                    <span className="text-base">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || loading}
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-lg font-semibold min-h-[56px] active:bg-blue-800"
            >
              <DollarSign size={24} />
              {loading ? 'Processing...' : 'Complete Sale'}
            </button>

            {cart.length > 0 && (
              <button
                onClick={() => {
                  showConfirmModal('Clear entire cart?', () => {
                    setCart([]);
                    setDiscount(0);
                    resetScanner();
                  });
                }}
                className="w-full mt-3 bg-red-100 text-red-700 py-3 rounded-lg hover:bg-red-200 transition min-h-[44px]"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>
      </div>

      {showInvoiceModal && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-green-600">
              ✓ Sale Completed!
            </h2>

            <div className="mb-6">
              <div className="text-gray-600">Invoice #: {lastSale.id}</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                ${lastSale.total.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {lastSale.items.length}{' '}
                {lastSale.items.length === 1 ? 'item' : 'items'}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePrintInvoice}
                className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 min-h-[56px] text-lg active:bg-blue-800"
              >
                <Printer size={20} />
                Print Invoice
              </button>

              <button
                onClick={handleDownloadInvoice}
                className="w-full bg-gray-600 text-white py-4 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 min-h-[56px] text-lg active:bg-gray-800"
              >
                <Download size={20} />
                Download PDF
              </button>

              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setLastSale(null);
                }}
                className="w-full bg-gray-200 text-gray-800 py-4 rounded-lg hover:bg-gray-300 min-h-[56px] text-lg active:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};