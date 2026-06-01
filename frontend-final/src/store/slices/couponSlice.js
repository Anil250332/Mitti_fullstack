import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

export const fetchAvailableCoupons = createAsyncThunk(
    'coupon/fetchAvailableCoupons',
    async (isOnlineOnly, { rejectWithValue }) => {
        try {
            const url = isOnlineOnly !== undefined ? `/coupons/available?isOnlineOnly=${isOnlineOnly}` : '/coupons/available';
            const response = await api.get(url);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch coupons');
        }
    }
);

export const applyCoupon = createAsyncThunk(
    'coupon/applyCoupon',
    async ({ code, orderAmount, isOnlineOnly }, { rejectWithValue }) => {
        try {
            const response = await api.post('/coupons/apply', { code, orderAmount, isOnlineOnly });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to apply coupon');
        }
    }
);

const initialState = {
    availableCoupons: [],
    appliedCoupon: null,
    loading: false,
    error: null,
};

const couponSlice = createSlice({
    name: 'coupon',
    initialState,
    reducers: {
        resetCoupon: (state) => {
            state.appliedCoupon = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAvailableCoupons.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAvailableCoupons.fulfilled, (state, action) => {
                state.loading = false;
                state.availableCoupons = action.payload;
            })
            .addCase(fetchAvailableCoupons.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(applyCoupon.pending, (state) => {
                state.loading = true;
            })
            .addCase(applyCoupon.fulfilled, (state, action) => {
                state.loading = false;
                state.appliedCoupon = action.payload;
                state.error = null; // Clear error on success
            })
            .addCase(applyCoupon.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.appliedCoupon = null;
            });
    },
});

export const { resetCoupon } = couponSlice.actions;
export default couponSlice.reducer;
