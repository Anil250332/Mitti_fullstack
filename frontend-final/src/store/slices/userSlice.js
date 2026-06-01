import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchAddresses = createAsyncThunk(
    'user/fetchAddresses',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/user/address/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch addresses');
        }
    }
);

export const fetchGeneralSettings = createAsyncThunk(
    'user/fetchGeneralSettings',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/admin/settings');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch settings');
        }
    }
);

export const saveAddress = createAsyncThunk(
    'user/saveAddress',
    async (addressData, { rejectWithValue, dispatch }) => {
        try {
            const response = await api.post('/user/address/save', addressData);
            dispatch(fetchAddresses());
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to save address');
        }
    }
);

export const deleteAddress = createAsyncThunk(
    'user/deleteAddress',
    async (addressId, { rejectWithValue, dispatch }) => {
        try {
            // Note: If no delete endpoint, we might need to add one or use save with some flag
            // But usually there is a DELETE /api/user/address/:id
            const response = await api.delete(`/user/address/${addressId}`);
            dispatch(fetchAddresses());
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete address');
        }
    }
);

export const fetchMyOrders = createAsyncThunk(
    'user/fetchMyOrders',
    async (params, { rejectWithValue }) => {
        try {
            const response = await api.get('/admin/orders/', { params }); // params = { page, limit }
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
        }
    }
);

export const downloadInvoice = createAsyncThunk(
    'user/downloadInvoice',
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/admin/orders/invoice/${orderId}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            return { success: true };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to download invoice');
        }
    }
);

const userSlice = createSlice({
    name: 'user',
    initialState: {
        addresses: [],
        orders: [],
        ordersPagination: {},
        loading: false,
        error: null,
    },
    reducers: {
        clearUserError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Addresses
            .addCase(fetchAddresses.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAddresses.fulfilled, (state, action) => {
                state.loading = false;
                state.addresses = action.payload.data;
            })
            .addCase(fetchAddresses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Orders
            .addCase(fetchMyOrders.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMyOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload.data;
                state.ordersPagination = action.payload.pagination || {};
            })
            .addCase(fetchMyOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete Address
            .addCase(deleteAddress.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteAddress.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(deleteAddress.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
