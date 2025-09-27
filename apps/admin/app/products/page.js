'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon,
  ArrowLeftIcon,
  PhotoIcon,
  TagIcon,
  CurrencyDollarIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    variants: [{
      title: 'Default',
      sku: '',
      prices: [{
        currency_code: 'usd',
        amount: 0
      }]
    }]
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:9000/store/products')
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleVariantChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }))
  }

  const handlePriceChange = (variantIndex, priceIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === variantIndex 
          ? {
              ...variant,
              prices: variant.prices.map((price, j) => 
                j === priceIndex ? { ...price, [field]: value } : price
              )
            }
          : variant
      )
    }))
  }

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, {
        title: '',
        sku: '',
        prices: [{
          currency_code: 'usd',
          amount: 0
        }]
      }]
    }))
  }

  const removeVariant = (index) => {
    if (formData.variants.length > 1) {
      setFormData(prev => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index)
      }))
    }
  }

  const addPrice = (variantIndex) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === variantIndex 
          ? {
              ...variant,
              prices: [...variant.prices, {
                currency_code: 'usd',
                amount: 0
              }]
            }
          : variant
      )
    }))
  }

  const removePrice = (variantIndex, priceIndex) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === variantIndex 
          ? {
              ...variant,
              prices: variant.prices.filter((_, j) => j !== priceIndex)
            }
          : variant
      )
    }))
  }

  const generateSKU = (title, variantTitle) => {
    const base = title.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3)
    const variant = variantTitle.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3)
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `${base}-${variant}-${random}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate SKUs if not provided
      const variantsWithSKU = formData.variants.map(variant => ({
        ...variant,
        sku: variant.sku || generateSKU(formData.title, variant.title)
      }))

      const productData = {
        ...formData,
        variants: variantsWithSKU,
        metadata: {
          category: formData.category
        }
      }

      const response = await fetch('http://localhost:9000/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Product created successfully!')
        setShowAddForm(false)
        setFormData({
          title: '',
          description: '',
          category: '',
          variants: [{
            title: 'Default',
            sku: '',
            prices: [{
              currency_code: 'usd',
              amount: 0
            }]
          }]
        })
        fetchProducts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create product')
      }
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error('Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100)
  }

  const categories = [
    'electronics',
    'fashion',
    'home',
    'food',
    'books',
    'sports',
    'beauty',
    'toys',
    'automotive',
    'other'
  ]

  return (
    <div className="admin-content">
      {/* Header */}
      <header className="admin-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <Link 
                href="/"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-black to-green-600 bg-clip-text text-transparent">
                Product Management
              </h1>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-accent inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Product
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Products Grid */}
          <div className="grid-responsive">
            {products.map((product) => (
              <div key={product.id} className="product-card group">
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-start mb-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors duration-200">
                        <PhotoIcon className="h-8 w-8 text-gray-400 group-hover:text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-green-600 transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {product.description}
                      </p>
                      <div className="mt-3">
                        <span className="badge badge-primary">
                          {product.metadata?.category || 'uncategorized'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-4 mt-auto">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Variants</p>
                        <p className="text-xl font-bold text-gray-900">
                          {product.variants?.length || 0}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-500">Starting at</p>
                        <p className="text-xl font-bold text-gray-900">
                          {product.variants?.[0]?.prices?.[0]?.amount 
                            ? formatCurrency(product.variants[0].prices[0].amount)
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <PhotoIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="heading-3 mb-3">No products yet</h3>
              <p className="text-body mb-8">Get started by creating your first product.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-accent inline-flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Product
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Add Product Modal */}
      {showAddForm && (
        <div className="modal-backdrop flex items-center justify-center p-4 z-50">
          <div className="modal-content w-full max-w-4xl max-h-[90vh] overflow-y-auto scale-in">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="heading-2">
                  Add New Product
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h4 className="heading-3">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="input-modern"
                      placeholder="Enter product title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="input-modern resize-none"
                      placeholder="Enter product description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="input-modern"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Variants */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="heading-3">Product Variants</h4>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="btn-ghost inline-flex items-center text-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Variant
                    </button>
                  </div>

                  {formData.variants.map((variant, variantIndex) => (
                    <div key={variantIndex} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h5 className="text-lg font-semibold text-gray-900">
                          Variant {variantIndex + 1}
                        </h5>
                        {formData.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(variantIndex)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-xl transition-all duration-200"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Variant Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={variant.title}
                            onChange={(e) => handleVariantChange(variantIndex, 'title', e.target.value)}
                            className="input-modern"
                            placeholder="e.g., Small, Red, etc."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            SKU
                          </label>
                          <input
                            type="text"
                            value={variant.sku}
                            onChange={(e) => handleVariantChange(variantIndex, 'sku', e.target.value)}
                            className="input-modern"
                            placeholder="Auto-generated if empty"
                          />
                        </div>
                      </div>

                      {/* Prices */}
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-semibold text-gray-700">
                            Prices
                          </label>
                          <button
                            type="button"
                            onClick={() => addPrice(variantIndex)}
                            className="btn-ghost inline-flex items-center text-xs"
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            Add Price
                          </button>
                        </div>

                        {variant.prices.map((price, priceIndex) => (
                          <div key={priceIndex} className="flex items-center space-x-3 mb-3">
                            <select
                              value={price.currency_code}
                              onChange={(e) => handlePriceChange(variantIndex, priceIndex, 'currency_code', e.target.value)}
                              className="w-20 input-modern"
                            >
                              <option value="usd">USD</option>
                              <option value="eur">EUR</option>
                              <option value="gbp">GBP</option>
                            </select>
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={price.amount / 100}
                              onChange={(e) => handlePriceChange(variantIndex, priceIndex, 'amount', Math.round(parseFloat(e.target.value) * 100))}
                              className="flex-1 input-modern"
                              placeholder="0.00"
                            />
                            {variant.prices.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePrice(variantIndex, priceIndex)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-xl transition-all duration-200"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner mr-3"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Create Product
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
