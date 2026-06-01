import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Async Thunks
// Async Thunks
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/user/login', credentials);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Login failed');
        }
    }
);

export const fetchMe = createAsyncThunk(
    'auth/fetchMe',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/user/me');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
        }
    }
);

export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (userData, { rejectWithValue, dispatch }) => {
        try {
            const response = await api.post('/user/save', userData);
            dispatch(fetchMe());
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Update failed');
        }
    }
);

export const updateGst = createAsyncThunk(
    'auth/updateGst',
    async (gstData, { rejectWithValue }) => {
        try {
            const response = await api.post('/user/gst-details', gstData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'GST Update failed');
        }
    }
);

export const changePasswordProfile = createAsyncThunk(
    'auth/changePasswordProfile',
    async (pwData, { rejectWithValue }) => {
        try {
            const response = await api.post('/user/change_password', pwData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Password change failed');
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/user/register', userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Registration failed');
        }
    }
);

export const resetPassword = createAsyncThunk(
    'auth/resetPassword',
    async ({ email, otp, newPassword }, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/user/reset-password', { email, otp, newPassword });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Password reset failed');
        }
    }
);

export const loginAdmin = createAsyncThunk(
    'auth/loginAdmin',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/admin/login', credentials);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Admin login failed');
        }
    }
);

export const fetchAdminMe = createAsyncThunk(
    'auth/fetchAdminMe',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/admin/users/me');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch admin');
        }
    }
);

const initialState = {
    user: null,
    token: localStorage.getItem('token') || null,
    permissions: [], // Initialize permissions array
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false, // Start false to avoid UI lock. Verification happens in background.
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
        setToken: (state, action) => {
            state.token = action.payload;
            localStorage.setItem('token', action.payload);
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
        },
        clearAuthError: (state) => {
            state.error = null;
        },
        setAuthError: (state, action) => {
            state.error = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                localStorage.setItem('token', action.payload.token);
                state.modalOpen = false; // Close modal on success
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Register
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                localStorage.setItem('token', action.payload.token);
                state.modalOpen = false; // Close modal on success
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Reset Password
            .addCase(resetPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state) => {
                state.loading = false;
                // Optionally show success message via state or toast
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Admin Login
            .addCase(loginAdmin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginAdmin.fulfilled, (state, action) => {
                state.loading = false;
                const userData = action.payload.user;
                // Always set role to 'admin' for accounts logging in through the admin portal
                state.user = {
                    ...userData,
                    role: 'admin'
                };
                state.token = action.payload.token;
                state.permissions = action.payload.permissions || [];
                state.isAuthenticated = true;
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(loginAdmin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch Admin Me
            .addCase(fetchAdminMe.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAdminMe.fulfilled, (state, action) => {
                state.loading = false;
                const adminData = action.payload.data;
                state.user = {
                    ...adminData,
                    name: `${adminData.firstName} ${adminData.lastName}`,
                    role: 'admin'
                };
                state.permissions = (adminData.permissions || []).map(p => p.pageKey);
                state.isAuthenticated = true;
            })
            .addCase(fetchAdminMe.rejected, (state) => {
                state.loading = false;
                state.user = null;
                state.permissions = [];
                state.isAuthenticated = false;
                localStorage.removeItem('token');
            })
            // Fetch Me
            .addCase(fetchMe.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMe.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.data;
                state.isAuthenticated = true;
            })
            .addCase(fetchMe.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update Profile
            .addCase(updateProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.loading = false;
                // Since updateUserDetails returns "User details updated successfully", 
                // we might need to refresh user or trust local update.
                // Best to let the component refresh it or we return user in API.
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setUser, setToken, logout, clearAuthError, setAuthError } = authSlice.actions;
export default authSlice.reducer;
