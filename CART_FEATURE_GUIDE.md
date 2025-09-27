# Cart Feature Guide

## Overview
The application now includes a comprehensive cart feature that allows users to add products to their cart, manage quantities, and proceed to checkout. The cart is implemented as a slide-out sidebar with full item management capabilities.

## Features

### 🛒 **Cart Sidebar**
- **Location**: Slide-out sidebar from the right side of the screen
- **Trigger**: Click the cart icon in the header (shows item count badge)
- **Mobile Support**: Also accessible via mobile menu

### 📱 **Cart Management Features**

#### **Add to Cart**
- Click "Add to Cart" button on any product
- Items are added with default quantity of 1
- If item already exists, quantity is incremented
- Success toast notification appears

#### **View Cart Items**
- **Product Image**: Placeholder icon for each item
- **Product Details**: Title and price per unit
- **Quantity Controls**: Plus/minus buttons to adjust quantity
- **Item Total**: Calculated price for each item
- **Remove Button**: Trash icon to remove items

#### **Quantity Management**
- **Increase**: Click + button to add quantity
- **Decrease**: Click - button to reduce quantity
- **Auto-remove**: Items are removed when quantity reaches 0
- **Real-time Updates**: Changes are reflected immediately

#### **Cart Summary**
- **Item Count**: Total number of items in cart
- **Total Price**: Sum of all item prices
- **Checkout Button**: Proceeds to checkout process
- **Clear Cart**: Option to remove all items

### 🎨 **UI/UX Features**

#### **Visual Indicators**
- **Cart Badge**: Shows total item count in header
- **Empty State**: Friendly message when cart is empty
- **Loading States**: Visual feedback during updates
- **Toast Notifications**: Success/error messages

#### **Responsive Design**
- **Desktop**: Full sidebar with detailed item management
- **Mobile**: Optimized layout for smaller screens
- **Touch-friendly**: Large buttons for mobile interaction

### 🔧 **Technical Implementation**

#### **Cart Context (`CartContext.js`)**
```javascript
const {
  cart,                    // Array of cart items
  addToCart,              // Add item to cart
  removeFromCart,         // Remove item by variant ID
  updateQuantity,         // Update item quantity
  clearCart,              // Clear all items
  getCartTotal,           // Calculate total price
  getCartItemCount        // Get total item count
} = useCart()
```

#### **Cart Item Structure**
```javascript
{
  id: "product-variant-id",
  product_id: "product-id",
  variant_id: "variant-id", 
  title: "Product Title",
  price: 29.99,
  quantity: 2,
  image: "/placeholder-product.jpg"
}
```

#### **State Management**
- **React Context**: Centralized cart state management
- **Local Storage**: Cart data persists across browser sessions
- **Automatic Sync**: All components share the same cart state
- **Real-time Updates**: Changes reflect immediately across all components

### 🚀 **How to Use**

1. **Add Items to Cart**
   - Browse products on the storefront
   - Click "Add to Cart" on desired products
   - Items appear in cart with quantity 1

2. **View Cart**
   - Click cart icon in header (shows item count)
   - Cart sidebar slides out from right
   - View all items with details and controls

3. **Manage Items**
   - Use +/- buttons to adjust quantities
   - Click trash icon to remove items
   - View real-time price updates

4. **Checkout**
   - Click "Checkout" button in cart
   - Must be signed in to proceed
   - Cart sidebar closes, checkout modal opens

### 📊 **Cart States**

#### **Empty Cart**
- Shows empty state with icon and message
- "Add some items to get started!" message
- No checkout button visible

#### **Items in Cart**
- Lists all cart items with details
- Shows quantity controls and remove buttons
- Displays total price and checkout button

#### **Loading States**
- Buttons disabled during quantity updates
- Visual feedback for all operations
- Smooth animations and transitions

### 🔄 **Integration Points**

#### **Product Display**
- "Add to Cart" buttons on all product cards
- Cart count badge in header
- Mobile cart access in hamburger menu

#### **Checkout Process**
- Cart data passed to checkout form
- Total price calculated and displayed
- Cart cleared after successful order

#### **Authentication**
- Cart works for both logged-in and guest users
- Checkout requires authentication
- Cart persists across login/logout

### ✅ **Features Implemented**

- ✅ **Add to Cart**: Products can be added with one click
- ✅ **Cart Sidebar**: Slide-out interface for cart management
- ✅ **Quantity Controls**: Plus/minus buttons for each item
- ✅ **Remove Items**: Individual item removal with trash icon
- ✅ **Cart Count Badge**: Shows total items in header
- ✅ **Price Calculation**: Real-time total price updates
- ✅ **Local Storage**: Cart persists across sessions
- ✅ **Mobile Support**: Responsive design for all devices
- ✅ **Empty State**: Friendly message when cart is empty
- ✅ **Toast Notifications**: User feedback for all actions
- ✅ **Checkout Integration**: Seamless flow to checkout process

### 🎯 **User Experience**

#### **Desktop Experience**
- Cart icon in header with item count badge
- Click to open full sidebar with detailed controls
- Smooth slide-out animation
- Easy quantity management with +/- buttons

#### **Mobile Experience**
- Cart accessible via hamburger menu
- Touch-friendly interface
- Optimized layout for small screens
- Same functionality as desktop

### 🛠 **Development Notes**

- **Frontend**: Next.js 14 with React 18
- **Styling**: Tailwind CSS with Heroicons
- **State Management**: React Context API with localStorage
- **Notifications**: react-hot-toast for user feedback
- **Responsive**: Mobile-first design approach

## Testing

The cart feature has been thoroughly tested with:
- ✅ Adding single and multiple products
- ✅ Quantity adjustments (increase/decrease)
- ✅ Item removal (individual and bulk)
- ✅ Cart persistence across page refreshes
- ✅ Mobile and desktop responsiveness
- ✅ Checkout flow integration
- ✅ Empty state handling
- ✅ Error handling and user feedback

## Current Status

🎉 **FULLY FUNCTIONAL** - The cart feature is complete and ready for use!

### **Access Points:**
- **Desktop**: Cart icon in header (top-right)
- **Mobile**: "Cart (X)" in hamburger menu
- **Direct**: Click any "Add to Cart" button

### **Key URLs:**
- **Storefront**: `http://localhost:3000`
- **Admin**: `http://localhost:3001`
- **API**: `http://localhost:9000`
