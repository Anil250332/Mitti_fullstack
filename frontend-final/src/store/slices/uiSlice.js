import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isMenuOpen: false,
    cartCount: 0,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleMenu: (state) => {
            state.isMenuOpen = !state.isMenuOpen;
        },
        closeMenu: (state) => {
            state.isMenuOpen = false;
        },
        incrementCart: (state) => {
            state.cartCount += 1;
        },
    },
});

export const { toggleMenu, closeMenu, incrementCart } = uiSlice.actions;
export default uiSlice.reducer;
