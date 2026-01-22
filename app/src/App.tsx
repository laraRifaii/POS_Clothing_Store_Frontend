// app/src/App.tsx (Simplified version)
import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './routes/AppRoutes';
import { ToastContainer } from 'react-toastify';
import { storeInfoApi } from './services/api/store-info.api';
import { invoiceService } from './services/invoice/invoice.service';
const App: React.FC = () => {
  
 useEffect(() => {
  const loadStoreInfo = async () => {
    try {
      const storeInfo = await storeInfoApi.get();
      if (storeInfo) {
        invoiceService.setStoreInfo(storeInfo);
        console.log('✅ Store info loaded:', storeInfo.name);
      } else {
        console.log('ℹ️ No store info configured yet. Please set it up in Settings.');
        invoiceService.setStoreInfo(null);
      }
    } catch (error) {
      console.error('❌ Error loading store info:', error);
      invoiceService.setStoreInfo(null);
    }
  };

  loadStoreInfo();
}, []);

  return (
    <>
      <AuthProvider>
        <BrowserRouter>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss={false} 
            draggable
            pauseOnHover
            theme="light" aria-label={undefined}          />

          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </>
  );
};

export default App;
