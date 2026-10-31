import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { WholesaleCartProvider } from './context/WholesaleCartContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        {/* CartProvider handles the customer's server-backed cart */}
        <CartProvider>
          {/* WholesaleCartProvider is independent — frontend-only cart for wholesalers */}
          <WholesaleCartProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </WholesaleCartProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

