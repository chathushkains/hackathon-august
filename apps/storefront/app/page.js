'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import UserProfile from '../components/UserProfile';
import CheckoutForm from '../components/CheckoutForm';
import CartSidebar from '../components/CartSidebar';
import { getProductImageUrl } from '../utils/imageGenerator';
import { 
  ShoppingCartIcon, 
  UserIcon, 
  HeartIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function StorefrontContent() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutStatus, setCheckoutStatus] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { user, isAuthenticated, logout } = useAuth();
  const { cart, addToCart, removeFromCart, clearCart, getCartItemCount, getCartTotal } = useCart();
  const { isConnected } = useSocket();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    console.log('Fetching products...');
    try {
      const response = await fetch('http://localhost:9000/store/products');
      const data = await response.json();
      console.log('Products fetched:', data);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    const variant = product.variants?.[0];
    if (!variant) {
      toast.error('Product variant not available');
      return;
    }

    const cartItem = {
      id: `${product.id}-${variant.id}`,
      product_id: product.id,
      variant_id: variant.id,
      title: product.title,
      price: variant.prices?.[0]?.amount / 100 || 0,
      quantity: 1,
      image: getProductImageUrl(product)
    };

    addToCart(cartItem);
    toast.success('Added to cart!');
  };

  const handleCheckout = async () => {
    setShowCheckout(true);
    setShowCart(false);
  };

  const handleCheckoutSuccess = (order) => {
    setCheckoutStatus('success');
    clearCart();
    setShowCheckout(false);
    toast.success('Order placed successfully!');
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="header-modern sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-black to-green-600 bg-clip-text text-transparent">
                SMB Commerce
              </h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for products, brands, and more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button className="p-3 text-gray-500 hover:text-gray-900 transition-all duration-200 hover:bg-gray-100 rounded-xl">
                <HeartIcon className="w-6 h-6" />
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowCart(true)}
                  className="p-3 text-gray-500 hover:text-gray-900 transition-all duration-200 hover:bg-gray-100 rounded-xl"
                >
                  <ShoppingCartIcon className="w-6 h-6" />
                  {getCartItemCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-semibold shadow-lg">
                      {getCartItemCount()}
                    </span>
                  )}
                </button>
              </div>

              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowProfile(true)}
                    className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 transition-all duration-200 hover:bg-gray-100 px-4 py-2 rounded-xl"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-medium">{user?.firstName}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowLogin(true)}
                    className="nav-link"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowRegister(true)}
                    className="btn-accent"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg">
          <div className="px-6 py-4 space-y-3">
            <button
              onClick={() => {
                setShowCart(true);
                setMobileMenuOpen(false);
              }}
              className="flex items-center space-x-3 w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-all duration-200"
            >
              <div className="p-2 bg-gray-100 rounded-lg">
                <ShoppingCartIcon className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium">Cart ({getCartItemCount()})</span>
            </button>
            
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setShowProfile(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserIcon className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-medium">Profile</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowLogin(true);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-all duration-200 font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setShowRegister(true);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-medium"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="heading-1 mb-4">Discover Amazing Products</h2>
          <p className="text-body text-xl max-w-2xl mx-auto">
            Shop the latest trends and find exactly what you're looking for with our curated collection.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid-responsive">
          {loading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="product-card p-0 animate-pulse">
                <div className="w-full h-64 bg-gray-200 rounded-t-2xl"></div>
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex justify-between items-center pt-4">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-10 bg-gray-200 rounded-xl w-24"></div>
                  </div>
                </div>
              </div>
            ))
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const variant = product.variants?.[0];
              const price = variant?.prices?.[0]?.amount / 100 || 0;
              const imageUrl = getProductImageUrl(product);
              
              return (
                <div key={product.id} className="product-card p-0 group flex flex-col h-full">
                  <div className="relative overflow-hidden flex-shrink-0">
                    <div className="w-full h-56 bg-gray-100 rounded-t-2xl overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full flex items-center justify-center" style={{ display: 'none' }}>
                        <ShoppingCartIcon className="w-16 h-16 text-gray-300" />
                      </div>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-t-2xl"></div>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors min-h-[2.5rem]">
                      {product.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">
                      {product.description}
                    </p>
                    <div className="flex items-end justify-between pt-2 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-xl font-bold text-black">
                          ${price.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">Free shipping</span>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="btn-accent text-sm px-3 py-2 min-w-[100px]"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCartIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="heading-3 mb-3">No products found</h3>
              <p className="text-body">Try adjusting your search or check back later for new arrivals.</p>
            </div>
          )}
        </div>
      </main>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={handleCheckout}
      />

      {/* Modals */}
      {showLogin && (
        <LoginForm
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}

      {showRegister && (
        <RegisterForm
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}

      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}

      {showCheckout && (
        <CheckoutForm
          cartItems={cart}
          total={getCartTotal()}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {/* Checkout Status */}
      {checkoutStatus === 'success' && (
        <div className="modal-backdrop flex items-center justify-center p-4 z-50">
          <div className="modal-content p-8 text-center max-w-md scale-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckIcon className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="heading-2 mb-3">Order Placed Successfully!</h2>
            <p className="text-body mb-8">
              Thank you for your order. You'll receive a confirmation email shortly with tracking details.
            </p>
            <button
              onClick={() => setCheckoutStatus(null)}
              className="btn-accent w-full"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <CartProvider>
        <StorefrontContent />
      </CartProvider>
    </AuthProvider>
  );
}