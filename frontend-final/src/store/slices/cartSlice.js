import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

export const fetchCart = createAsyncThunk(
    'cart/fetchCart',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/cart');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
        }
    }
);

export const addToCart = createAsyncThunk(
    'cart/addToCart',
    async ({ productId, quantity }, { dispatch, rejectWithValue }) => {
        try {
            const response = await api.post('/cart/add', { productId, quantity });
            toast.success(response.data.message);
            dispatch(fetchCart());
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add to cart');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

export const reorderItems = createAsyncThunk(
    'cart/reorderItems',
    async (items, { dispatch, rejectWithValue }) => {
        try {
            // Sequential API calls for now. Backend could be optimized for bulk later.
            for (const item of items) {
                await api.post('/cart/add', {
                    productId: item.productId,
                    quantity: item.quantity
                });
            }
            toast.success("Items added to cart!");
            dispatch(fetchCart());
            return { success: true };
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reorder');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

export const placeOrder = createAsyncThunk(
    'cart/placeOrder',
    async (orderData, { dispatch, rejectWithValue }) => {
        try {
            // Note: Backend endpoint is /api/admin/orders/save for placing order
            const response = await api.post('/admin/orders/save', orderData);
            toast.success(response.data.message || 'Order placed successfully!');
            dispatch(fetchCart()); // Clear cart in state by re-fetching (backend clears it)
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to place order');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

export const removeFromCart = createAsyncThunk(
    'cart/removeFromCart',
    async (productId, { dispatch, rejectWithValue }) => {
        try {
            const response = await api.delete(`/cart/remove/${productId}`);
            toast.success(response.data.message);
            dispatch(fetchCart());
            return productId;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to remove from cart');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

export const clearCart = createAsyncThunk(
    'cart/clearCart',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            const response = await api.delete('/cart/clear');
            toast.success(response.data.message);
            dispatch(fetchCart());
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to clear cart');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

const initialState = {
    items: [],
    loading: false,
    error: null,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default cartSlice.reducer;
