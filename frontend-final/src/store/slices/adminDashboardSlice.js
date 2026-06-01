import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchDashboardStats = createAsyncThunk(
    'adminDashboard/fetchDashboardStats',
    async (range = 'year', { rejectWithValue }) => {
        try {
            const [countsRes, statusCountsRes, topProductsRes, topCustomersRes, statsRes] = await Promise.all([
                api.get('/admin/dashboard/counts'),
                api.get('/admin/orders/order-status-counts'), // Reusing the endpoint from orders
                api.get('/admin/dashboard/top-products'),
                api.get('/admin/dashboard/top-customers'),
                api.get(`/admin/dashboard/statistics?range=${range}`)
            ]);

            return {
                counts: countsRes.data.data,
                statusCounts: statusCountsRes.data.data,
                topProducts: (topProductsRes.data.data || []).map(p => ({
                    id: p.id,
                    name: p.productName,
                    orders: p.totalOrders
                })),
                topCustomers: (topCustomersRes.data.data || []).map(c => ({
                    id: c.CustomerId,
                    name: c.customerName,
                    phone: c.phone,
                    orders: c.orderCounts,
                    spent: c.orderAmount
                })),
                chartData: statsRes.data.data
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard stats');
        }
    }
);

const initialState = {
    counts: {
        totalOrders: 0,
        totalCategories: 0,
        totalProducts: 0,
        totalCustomers: 0,
    },
    statusCounts: {
        pending: 0,
        confirmed: 0,
        packaging: 0,
        outForDelivery: 0,
        partiallyDelivered: 0,
        delivered: 0,
    },
    topProducts: [],
    topCustomers: [],
    chartData: null,
    loading: false,
    error: null,
};

const adminDashboardSlice = createSlice({
    name: 'adminDashboard',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardStats.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDashboardStats.fulfilled, (state, action) => {
                state.loading = false;
                state.counts = action.payload.counts || initialState.counts;
                state.statusCounts = action.payload.statusCounts || initialState.statusCounts;
                state.topProducts = action.payload.topProducts || [];
                state.topCustomers = action.payload.topCustomers || [];
                state.chartData = action.payload.chartData || null;
            })
            .addCase(fetchDashboardStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default adminDashboardSlice.reducer;
