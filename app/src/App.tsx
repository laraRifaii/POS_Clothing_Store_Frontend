// app/src/App.tsx (Simplified version)
import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './routes/AppRoutes';
import { ToastContainer } from 'react-toastify';
import { LicenseProvider } from './contexts/LicenseContext';
import { LicenseGuard } from './components/LicenseGuard';
const App: React.FC = () => {
  return (
    <>
      <AuthProvider>
        <LicenseProvider>
          <LicenseGuard>

            <BrowserRouter>
              {/* Toast Container with proper configuration */}
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick={true}
                rtl={false}
                pauseOnFocusLoss={true}
                draggable={true}
                pauseOnHover={true}
                theme="light"
                limit={5} // Allow up to 5 toasts at once
                style={{ zIndex: 9999 }} // Ensure toasts appear on top
              />

              <AppRoutes />
            </BrowserRouter>
          </LicenseGuard>
        </LicenseProvider>
      </AuthProvider>
    </>
  );
};

export default App;
