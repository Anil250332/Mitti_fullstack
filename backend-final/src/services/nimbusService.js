const axios = require('axios');
const auth = require('../utils/auth');
const { nimbus } = require('../config/env');

class NimbusService {
    /**
     * Request wrapper with isolated axios instance for NimbusPost
     */
    async _request(method, path, payload = null) {
        const url = `${nimbus.baseUrl}${path}`;
        
        // 1. Get fresh token and clean headers
        let headers = await auth.getHeader();

        // 2. ISOLATION: Create a brand new, isolated axios instance for every request
        // This ensures NO global interceptors or defaults can interfere.
        const axiosInstance = require('axios').create();

        
        try {
            // 3. CONSTRUCT CONFIG
            // Ensure headers are completely isolated and specific
            const config = { 
                method, 
                url, 
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": headers.Authorization
                }
            };

            if (payload) config.data = payload;

            const response = await axiosInstance(config);
            return response.data;
        } catch (error) {
            // Handle 401: Refresh and retry ONCE
            if (error.response?.status === 401) {
                auth.clearToken();
                headers = await auth.getHeader();
                
                const retryConfig = { 
                    method, 
                    url, 
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": headers.Authorization
                    }
                };
                if (payload) retryConfig.data = payload;

                const response = await axiosInstance(retryConfig);
                return response.data;
            }
            
            const nimbusError = error.response?.data || error.message;
            throw error;
        }
    }

    /**
     * Shipment Creation (B2C Standard)
     */
    async createOrder(payload) {
        try {
            const data = await this._request('post', '/shipments/create', payload);
            return data;
        } catch (error) {
            return error.response?.data || { status: false, message: error.message };
        }
    }

    /**
     * Serviceability API (B2C Standard Format)
     */
    async checkServiceability(origin, destination, weight, paymentType, orderAmount) {
        try {
            // Normalize payment type for Nimbus (cod, prepaid)
            let nimbusPaymentType = (paymentType || 'cod').toLowerCase();
            if (nimbusPaymentType === 'online' || nimbusPaymentType === 'prepaid') {
                nimbusPaymentType = 'prepaid';
            }

            const payload = {
                origin: String(origin),
                destination: String(destination),
                weight: Number(weight),
                payment_type: nimbusPaymentType,
                order_amount: Number(orderAmount)
            };

            return await this._request('post', '/courier/serviceability', payload);
        } catch (error) {
            return { status: false, message: error.message };
        }
    }

    /**
     * Tracking API
     */
    async getTracking(awbNumber) {
        try {
            return await this._request('get', `/shipments/track/awb/${awbNumber}`);
        } catch (error) {
            return null;
        }
    }

    // --- UTILITIES ---

    /**
     * Finds the lowest-priced Surface courier from Nimbus data.
     */
    getBestSurfaceRate(courierList, requestedWeightKg = 0.5) {
        if (!Array.isArray(courierList) || courierList.length === 0) return { charge: 0, courierName: "N/A" };
        const requestedWeightG = requestedWeightKg * 1000;

        const isSurface = (c) => {
            const fields = [c.service_type, c.mode, c.shipment_type, c.courier_type, c.type, c.courier_name, c.name];
            return fields.some(f => String(f || "").toLowerCase().includes("surface"));
        };

        const surfaceOptions = courierList.filter(isSurface);
        const optionsToConsider = surfaceOptions.length > 0 ? surfaceOptions : courierList;
        const compatibleOptions = optionsToConsider.filter(r => (Number(r.chargeable_weight || r.min_weight || 500)) >= requestedWeightG);
        const finalOptions = compatibleOptions.length > 0 ? compatibleOptions : optionsToConsider;

        const mapped = finalOptions.map(r => {
            const charge = Number(r.total_charges || r.total_charge || r.courier_charges || r.rate || 0);
            return { name: r.name || r.courier_name || "Unknown", charge: Math.ceil(charge), weight: Number(r.chargeable_weight || 0) };
        }).filter(o => o.charge > 0);

        if (mapped.length === 0) return { charge: 0, courierName: "N/A" };
        mapped.sort((a, b) => a.charge - b.charge);
        return { charge: mapped[0].charge, courierName: mapped[0].name };
    }

    /**
     * Calculates total weight from product details and jar rules.
     */
    buildShippingDetails(products, items) {
        let totalWeightKg = 0;
        items.forEach(item => {
            const p = products.find(prod => prod.id === (item.productId || item.id));
            const quantity = Number(item.quantity || item.qty || 1);
            let perUnitKg = 0.5;
            if (p) {
                const rawWeight = String(p.Weight || p.weight || "").trim();
                const val = parseFloat(rawWeight);
                if (rawWeight.toLowerCase().includes("kg")) perUnitKg = val;
                else if (rawWeight.toLowerCase().includes("g")) perUnitKg = val / 1000;
                else if (!isNaN(val) && val > 0) perUnitKg = val;
            }
            totalWeightKg += perUnitKg * quantity;
        });
        if (totalWeightKg < 0.5) totalWeightKg = 0.5;
        return { totalWeightKg };
    }
}

module.exports = new NimbusService();
