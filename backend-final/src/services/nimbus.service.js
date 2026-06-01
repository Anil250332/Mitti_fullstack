const axios = require('axios');
const { nimbus } = require('../config/env');
const { NimbusLog } = require('../models');

/**
 * NimbusPost Shipment Service
 * Handles: Login, Robust Token Management (Async Locking), and Database Logging
 */
class NimbusService {
    constructor() {
        this.token = null;
        this.baseUrl = nimbus.baseUrl || 'https://api.nimbuspost.com/v1';
        this.loginPromise = null;
    }

    /**
     * Singleton Login: Ensures multiple parallel requests wait for a single login call.
     */
    async login() {
        if (this.loginPromise) return this.loginPromise;

        this.loginPromise = (async () => {
            try {
                if (!nimbus.email || !nimbus.password) {
                    throw new Error("Missing NimbusPost credentials in environment variables.");
                }

                const response = await axios.post(`${this.baseUrl}/users/login`, {
                    email: nimbus.email,
                    password: nimbus.password
                });

                const retrievedToken = (response.data?.data?.token) ||
                    (typeof response.data?.data === 'string' ? response.data.data : null);

                if (retrievedToken && typeof retrievedToken === 'string') {
                    this.token = retrievedToken.trim();
                    // Log success (optional, but good for tracking)
                    await this._log('login', '/users/login', { email: nimbus.email }, response.data, true);
                    return this.token;
                } else {
                    throw new Error("Token missing or invalid in login response.");
                }
            } catch (error) {
                const errorMsg = error.response?.data?.message || error.message;
                await this._log('login', '/users/login', { email: nimbus.email }, error.response?.data || { message: error.message }, false, errorMsg);
                this.token = null;
                throw error;
            } finally {
                this.loginPromise = null;
            }
        })();

        return this.loginPromise;
    }

    /**
     * Internal logging helper
     */
    async _log(type, endpoint, payload, response, success, errorMsg = null) {
        try {
            // Only require the model if it exists (for safety)
            if (NimbusLog) {
                await NimbusLog.create({
                    type,
                    endpoint,
                    requestPayload: payload ? JSON.stringify(payload) : null,
                    responseData: response ? JSON.stringify(response) : null,
                    errorMessage: errorMsg,
                    success
                });
            }
        } catch (logError) {
            console.error("FAIL_LOG:", logError.message);
        }
    }

    /**
     * Request wrapper with auto-retry and database logging
     */
    async _request(method, path, payload = null, logType = 'api') {
        if (!this.token) await this.login();

        const url = `${this.baseUrl}${path}`;

        const executeRequest = async (tokenValue) => {
            return axios({
                method,
                url,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${tokenValue}`
                },
                data: payload
            });
        };

        // try {
        const response = await executeRequest(this.token);

        if (response.data.status === false) {
            this.token = null;
            this.loginPromise = null;
            const newToken = await this.login(); // This will wait if another request is already logging in

            const retryResponse = await executeRequest(newToken);
            await this._log(logType, path, payload, retryResponse.data, true);
            return retryResponse.data;
        }
        else {
            // Log successful shipping/tracking calls
            await this._log(logType, path, payload, response.data, true);
            return response.data;
        }
        // } catch (error) {
        //     // Handle 401 Unauthorized (Expired Token)
        //     if (error.response?.status === 401) {
        //         this.token = null;
        //         const newToken = await this.login(); // This will wait if another request is already logging in

        //         const retryResponse = await executeRequest(newToken);
        //         await this._log(logType, path, payload, retryResponse.data, true);
        //         return retryResponse.data;
        //     }

        //     const errorMsg = error.response?.data?.message || error.message;
        //     // Log Failure
        //     await this._log(logType, path, payload, error.response?.data || { message: error.message }, false, errorMsg);
        //     throw error;
        // }
    }

    /**
     * Create B2C Shipment
     */
    async createShipment(payload) {
        try {
            const cleanedPayload = this.validateAndCleanPayload(payload);
            const data = await this._request('post', '/shipments', cleanedPayload, 'create_shipment');
            return data;
        } catch (error) {
            return { status: false, message: error.message };
        }
    }

    validateAndCleanPayload(p) {
        const payload = { ...p };
        if (payload.consignee && payload.consignee.phone) {
            payload.consignee.phone = String(payload.consignee.phone).replace(/\D/g, '').slice(-10);
        } else if (payload.consignee_phone) {
            payload.consignee_phone = String(payload.consignee_phone).replace(/\D/g, '').slice(-10);
        }
        if (payload.package_weight) payload.package_weight = Number(payload.package_weight);
        if (payload.weight) payload.weight = Number(payload.weight);
        if (payload.package_length) payload.package_length = Number(payload.package_length);
        if (payload.package_breadth) payload.package_breadth = Number(payload.package_breadth);
        if (payload.package_height) payload.package_height = Number(payload.package_height);
        if (payload.consignee && payload.consignee.state) {
            payload.consignee.state = payload.consignee.state.trim();
        } else if (payload.consignee_state) {
            payload.consignee_state = payload.consignee_state.trim();
        }
        return payload;
    }

    /**
     * Tracking API
     */
    async trackShipment(awb) {
        try {
            return await this._request('get', `/shipments/track/${awb}`, null, 'tracking');
        } catch (error) {
            return { status: false, message: error.message };
        }
    }

    /**
     * Serviceability API (Check courier rates)
     */
    async checkServiceability(origin, destination, weightG, paymentType, orderAmount) {
        try {
            const nimbusPaymentType = (paymentType || 'cod').toLowerCase() === 'cod' ? 'cod' : 'prepaid';
            const payload = {
                origin: String(origin),
                destination: String(destination),
                weight: Number(weightG),
                payment_type: nimbusPaymentType,
                order_amount: Number(orderAmount)
            };
            return await this._request('post', '/courier/serviceability', payload, 'check_serviceability');
        } catch (error) {
            // Rethrow so controller/service can decide what to do
            throw error;
        }
    }

    /**
     * Finds the lowest-priced Surface courier
     */
    getBestSurfaceRate(courierList, requestedWeightG = 500) {
        if (!Array.isArray(courierList) || courierList.length === 0) return { charge: 0, courierName: "N/A" };

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
            return {
                name: r.name || r.courier_name || "Unknown",
                charge: Math.ceil(charge),
                weight: Number(r.chargeable_weight || 0),
                id: r.id || r.courier_id
            };
        }).filter(o => o.charge > 0);

        if (mapped.length === 0) return { charge: 0, courierName: "N/A" };
        mapped.sort((a, b) => a.charge - b.charge);
        return { charge: mapped[0].charge, courierName: mapped[0].name, id: mapped[0].id };
    }

    /**
     * Calculates total weight from product details
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
