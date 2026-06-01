import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import adminReducer from './slices/adminSlice';
import authReducer from './slices/authSlice';
import adminDashboardReducer from './slices/adminDashboardSlice';
import productReducer from './slices/productSlice';
import settingsReducer from './slices/settingsSlice';
import userReducer from './slices/userSlice';
import sliderReducer from './slices/sliderSlice';

import cartReducer from './slices/cartSlice';
import wishlistReducer from './slices/wishlistSlice';
import couponReducer from './slices/couponSlice';

export const store = configureStore({
    reducer: {
        ui: uiReducer,
        admin: adminReducer,
        auth: authReducer,
        user: userReducer,
        slider: sliderReducer,
        adminDashboard: adminDashboardReducer,
        product: productReducer,
        settings: settingsReducer,
        cart: cartReducer,
        wishlist: wishlistReducer,
        coupon: couponReducer,
    },
});
