/**
 * Centralized environment configuration
 */
module.exports = {
    nimbus: {
        baseUrl: (process.env.NIMBUS_BASE_URL || 'https://api.nimbuspost.com/v1').trim(),
        email: (process.env.NIMBUS_EMAIL || "").trim(),
        password: (process.env.NIMBUS_PASSWORD || "").trim()
    }
};
