import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchAdminData = createAsyncThunk(
    'admin/fetchAdminData',
    async (_, { rejectWithValue }) => {
        try {
            // Since there is no combined /admin/data endpoint, fetch individually
            const [categoriesRes] = await Promise.all([
                api.get('/admin/categories'),
            ]);

            return {
                categories: categoriesRes.data.data || [],
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch admin data');
        }
    }
);

export const fetchUsers = createAsyncThunk(
    'admin/fetchUsers',
    async (params, { rejectWithValue }) => {
        try {
            // Note: DashboardUsers.jsx shows customers, so we use the customers endpoint
            const response = await api.get('/admin/users/customers', { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
        }
    }
);


const initialState = {
    categories: [],
    users: [],
    pagination: {},
    loading: false,
    error: null,
};

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAdminData.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = action.payload.categories || [];
            })
            .addCase(fetchAdminData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload.data || [];
                state.pagination = action.payload.pagination || {};
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default adminSlice.reducer;
