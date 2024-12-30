import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, ShoppingCart, Search, ArrowLeft, FastForward, ChevronDown, ChevronUp } from 'lucide-react';
// import { Alert, AlertDescription } from '@/components/ui/alert';

const FoodOrderApp = ({ route }) => {
  // Extracting route params with defaults
  const { guests = 1, time, date } = route?.params || {};
  
  // State management
  const [products, setProducts] = useState([]);
  const [categorizedProducts, setCategorizedProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [toggleStates, setToggleStates] = useState({});
  const [selectedUnits, setSelectedUnits] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [checkedItems, setCheckedItems] = useState({});
  const [categories, setCategories] = useState([]);

  // API configuration
  const API_BASE_URL = 'https://localhost:4000/api';
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add interceptor to handle token
  axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.token = token;
    }
    return config;
  });

  // Fetch cart items on mount
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/cart/getcart');
        setCartItems(response.data.cartitem.cart_order_details || []);
      } catch (error) {
        console.error('Error fetching cart items:', error);
        setError('Failed to fetch cart items. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCartItems();
  }, []);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/products');
        
        if (!Array.isArray(response.data)) {
          throw new Error('Invalid data format received from API');
        }

        setProducts(response.data);
        
        // Categorize products
        const productsByCategory = response.data.reduce((acc, product) => {
          if (!acc[product.category_name]) {
            acc[product.category_name] = [];
          }
          acc[product.category_name].push(product);
          return acc;
        }, {});
        
        setCategorizedProducts(productsByCategory);
        const categoryList = Object.keys(productsByCategory);
        setCategories(categoryList);
        setFilteredCategories(categoryList);
        
        // Initialize toggle states and selected units
        const initialStates = response.data.reduce((acc, product) => ({
          toggles: { ...acc.toggles, [product.product_id]: false },
          units: { ...acc.units, [product.product_id]: product.plate_units }
        }), { toggles: {}, units: {} });
        
        setToggleStates(initialStates.toggles);
        setSelectedUnits(initialStates.units);
        
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to fetch products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Calculate cart totals
  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = item.price || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
  };

  // Handle search
  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = categories.filter(category =>
      category.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredCategories(filtered);
  };

  // Toggle category expansion
  const handleCategoryExpand = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Handle cart operations
  const toggleCartItem = async (item) => {
    try {
      const existingItemIndex = cartItems.findIndex(cartItem => 
        cartItem.product_id === item.product_id
      );
      
      let newCartItems;
      if (existingItemIndex !== -1) {
        newCartItems = cartItems.filter((_, index) => index !== existingItemIndex);
        setCheckedItems(prev => ({
          ...prev,
          [item.product_id]: false
        }));
      } else {
        const isToggled = toggleStates[item.product_id];
        const selectedUnit = isToggled ? item.wtorvol_units : item.plate_units;
        
        setCheckedItems(prev => ({
          ...prev,
          [item.product_id]: true
        }));
        
        const newItem = {
          ...item,
          quantity: 1,
          selectedUnit,
          isToggled
        };
        
        newCartItems = [...cartItems, newItem];
      }

      // Update backend
      await updateCart(newCartItems);
      
      // Update local state
      setCartItems(newCartItems);
      
    } catch (error) {
      console.error('Error updating cart:', error);
      setError('Failed to update cart. Please try again.');
    }
  };

  // Update cart in backend
  const updateCart = async (items) => {
    const requestData = {
      totalAmount: calculateSubtotal().toFixed(2),
      cartData: items,
      address: {
        a: 'dfghj',
        b: 'sdfg'
      },
      selectedDate: date,
      numberOfPlates: guests,
      selectedTime: time,
    };

    await axiosInstance.post('/cart/add', requestData);
  };

  // Sub-components
  const CategoryItem = ({ categoryName, products }) => {
    const isExpanded = expandedCategories[categoryName];

    return (
      <div className="bg-green-100 rounded-lg mb-4 mx-2 overflow-hidden">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => handleCategoryExpand(categoryName)}
        >
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 mr-4">
              <img
                src="/api/placeholder/64/64"
                alt={categoryName}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-lg font-semibold text-gray-800">{categoryName}</p>
          </div>
          <div className="flex flex-col items-center">
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            <div className="bg-red-500 rounded-full w-6 h-6 flex items-center justify-center">
              <p className="text-white text-sm font-bold">{products.length}</p>
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <div className="bg-gray-100 px-4">
            {products.map((product) => (
              <SubCategoryItem key={product.product_id} item={product} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const SubCategoryItem = ({ item }) => {
    const isInCart = cartItems.some(cartItem => cartItem.product_id === item.product_id);
    const isChecked = checkedItems[item.product_id] || false;
    const isToggled = toggleStates[item.product_id] || false;

    const handleToggle = () => {
      setToggleStates(prev => ({
        ...prev,
        [item.product_id]: !prev[item.product_id]
      }));
      
      const newUnit = !isToggled ? item.wtorvol_units : item.plate_units;
      setSelectedUnits(prev => ({
        ...prev,
        [item.product_id]: newUnit
      }));

      if (isInCart) {
        const updatedCartItems = cartItems.map(cartItem => {
          if (cartItem.product_id === item.product_id) {
            return {
              ...cartItem,
              selectedUnit: newUnit,
              isToggled: !isToggled
            };
          }
          return cartItem;
        });
        setCartItems(updatedCartItems);
        updateCart(updatedCartItems).catch(console.error);
      }
    };

    return (
      <div className="bg-white rounded-lg shadow my-2 p-4">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 mr-4">
            <img
              src="/api/placeholder/64/64"
              alt={item.productname}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold text-gray-800 mt-2">{item.productname}</p>
            {item.isdual && (
              <div className="mt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isToggled}
                    onChange={handleToggle}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center">
            <p className="text-green-600 font-bold">
              {isToggled ? item.wtorvol_units : item.plate_units}
            </p>
          </div>
          <button
            onClick={() => toggleCartItem(item)}
            className={`px-4 py-2 rounded-md font-bold text-white ${
              isInCart ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isInCart ? 'REMOVE' : 'ADD'}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  // if (error) {
  //   return (
  //     <Alert variant="destructive">
  //       <AlertDescription>{error}</AlertDescription>
  //     </Alert>
  //   );
  // }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full p-2 border rounded-lg"
        />
      </div>

      {filteredCategories.map(categoryName => (
        <CategoryItem
          key={categoryName}
          categoryName={categoryName}
          products={categorizedProducts[categoryName] || []}
        />
      ))}
    </div>
  );
};

export default FoodOrderApp;