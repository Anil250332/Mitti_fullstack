import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

export const fetchWishlist = createAsyncThunk(
    'wishlist/fetchWishlist',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/wishlist');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
        }
    }
);

export const addToWishlist = createAsyncThunk(
    'wishlist/addToWishlist',
    async (productId, { dispatch, rejectWithValue }) => {
        try {
            const response = await api.post(`/wishlist/add/${productId}`);
            toast.success(response.data.message);
            dispatch(fetchWishlist());
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add to wishlist');
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

export const removeFromWishlist = createAsyncThunk(
    'wishlist/removeFromWishlist',
    async (arg, { dispatch, rejectWithValue }) => {
        const productId = typeof arg === 'object' ? arg.productId : arg;
        const silent = typeof arg === 'object' ? arg.silent : false;
        try {
            const response = await api.delete(`/wishlist/remove/${productId}`);
            if (!silent) {
                toast.success(response.data.message);
            }
            dispatch(fetchWishlist());
            return productId;
        } catch (error) {
            if (!silent) {
                toast.error(error.response?.data?.message || 'Failed to remove from wishlist');
            }
            return rejectWithValue(error.response?.data?.message);
        }
    }
);

const initialState = {
    items: [],
    loading: false,
    error: null,
};

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchWishlist.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWishlist.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchWishlist.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default wishlistSlice.reducer;
