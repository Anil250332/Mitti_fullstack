import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchSliders = createAsyncThunk(
    'slider/fetchSliders',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/sliders');
            return response.data.data || response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch sliders');
        }
    }
);

const initialState = {
    items: [],
    loading: false,
    error: null,
};

const sliderSlice = createSlice({
    name: 'slider',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchSliders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSliders.fulfilled, (state, action) => {
                state.loading = false;
                state.items = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchSliders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default sliderSlice.reducer;
