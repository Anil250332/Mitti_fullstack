const axios = require('axios');
const { nimbus } = require('../config/env');

class NimbusAuth {
    constructor() {
        this.token = null;
        this.isLoggingIn = false;
    }

    /**
     * Login to NimbusPost and get a Bearer token
     * DO NOT hash, encode, or modify the token.
     */
    async login() {
        if (this.isLoggingIn) return;
        this.isLoggingIn = true;

        try {
            
            if (!nimbus.email || !nimbus.password) {
                throw new Error("Missing NimbusPost credentials in environment variables.");
            }

            const axiosInstance = require('axios').create();
            const response = await axiosInstance.post(`${nimbus.baseUrl}/users/login`, {
                email: nimbus.email,
                password: nimbus.password
            });

            // Extract token: Prioritize response.data.data.token, fallback to response.data.data
            let retrievedToken = (response.data?.data?.token) || 
                                 (typeof response.data?.data === 'string' ? response.data.data : null);

            if (retrievedToken && typeof retrievedToken === 'string') {
                this.token = retrievedToken.trim();

             
                // Block if it looks like a raw SHA-256 or Base64 string WITHOUT JWT structure (no dots)
                if (!this.token.includes('.') && this.token.length > 20) {
                     // Invalid token format received from NimbusPost
                     throw new Error("Invalid token format received from NimbusPost.");
                }

            } else {
                throw new Error("Token missing or invalid in login response.");
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            this.token = null;
            throw error;
        } finally {
            this.isLoggingIn = false;
        }
    }

    /**
     * Returns Authorization and Content-Type headers
     */
    async getHeader() {
        if (!this.token) await this.login();
        if (!this.token) throw new Error("Could not obtain NimbusPost authentication token.");

        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Force token refresh on next request
     */
    clearToken() {
        this.token = null;
    }
}

module.exports = new NimbusAuth();
