import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// ... imports

export const fetchProducts = createAsyncThunk(
    'product/fetchProducts',
    async (params, { rejectWithValue }) => {
        try {
            const response = await api.get('/products', { params });
            return response.data; // The API returns { success: true, data: [], pagination: {} }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
        }
    }
);

export const fetchCategories = createAsyncThunk(
    'product/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/products/categories');
            return response.data.data || response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
        }
    }
);

export const fetchSubCategories = createAsyncThunk(
    'product/fetchSubCategories',
    async (categoryId, { rejectWithValue }) => {
        try {
            const params = categoryId ? { categoryId } : undefined;
            const response = await api.get('/products/subcategories', { params });
            return response.data.data || response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch sub categories');
        }
    }
);

export const fetchWeights = createAsyncThunk(
    'product/fetchWeights',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/products/weights');
            return response.data.data || response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch weights');
        }
    }
);

export const fetchPieces = createAsyncThunk(
    'product/fetchPieces',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/products/pieces');
            return response.data.data || response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch pieces');
        }
    }
);

export const fetchMinMaxPrice = createAsyncThunk(
    'product/fetchMinMaxPrice',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/products/min-max-price');
            return response.data; // Helper returns { success: true, minPrice: ..., maxPrice: ... }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch price range');
        }
    }
);



export const fetchProductDetails = createAsyncThunk(
    'product/fetchProductDetails',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`/products/product-details?id=${id}`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch product details');
        }
    }
);


export const fetchBestSellers = createAsyncThunk(
    'product/fetchBestSellers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/products/best-sellers');
            return response.data; // The API returns { success: true, count: ..., data: [] }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch best sellers');
        }
    }
);


export const fetchTags = createAsyncThunk(
    'product/fetchTags',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/products/tags');
            return response.data.data || response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch tags');
        }
    }
);

const initialState = {
    items: [],
    bestSellers: [],
    categories: [],
    subcategories: [],
    weights: [],
    tags: [],
    pieces: [],
    minPrice: 0,
    maxPrice: 10000,
    currentProduct: null,
    loading: false,
    error: null,
    pagination: {},
};

const productSlice = createSlice({
    name: 'product',
    initialState,
    reducers: {
        clearCurrentProduct: (state) => {
            state.currentProduct = null;
        },
        clearSubCategories: (state) => {
            state.subcategories = [];
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.items = [];
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                // Handle new API response structure with pagination
                if (action.payload.data && Array.isArray(action.payload.data)) {
                    state.items = action.payload.data;
                    state.pagination = action.payload.pagination || {};
                } else if (Array.isArray(action.payload)) {
                    state.items = action.payload;
                    state.pagination = {};
                } else {
                    state.items = [];
                }
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchBestSellers.fulfilled, (state, action) => {
                state.bestSellers = action.payload.data || [];
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.categories = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchSubCategories.fulfilled, (state, action) => {
                state.subcategories = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchWeights.fulfilled, (state, action) => {
                state.weights = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchTags.fulfilled, (state, action) => {
                state.tags = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchPieces.fulfilled, (state, action) => {
                state.pieces = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchMinMaxPrice.fulfilled, (state, action) => {
                state.minPrice = action.payload.minPrice || 0;
                state.maxPrice = action.payload.maxPrice || 10000;
            })

            .addCase(fetchProductDetails.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProductDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.currentProduct = action.payload;
            })
            .addCase(fetchProductDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearCurrentProduct, clearSubCategories } = productSlice.actions;
export default productSlice.reducer;
