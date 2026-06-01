// const axios = require('axios');
// const dotenv = require('dotenv');
// const fs = require('fs');
// const path = require('path');
// dotenv.config();

// function logToFile(message) {
//     const logPath = path.join(__dirname, '../../email_debug.log');
//     const timestamp = new Date().toISOString();
//     fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
// }

// exports.sendOTPEmail = async (to_email, otp, to_name = "User") => {
//     try {
//         logToFile(`\n--- New Email Attempt ---`);
//         logToFile(`To: ${to_email}, Name: ${to_name}, OTP: ${otp}`);
        
//         if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_PRIVATE_KEY) {
//             logToFile(`Error: Missing Env Vars. SERVICE: ${!!process.env.EMAILJS_SERVICE_ID}, PUBLIC: ${!!process.env.EMAILJS_PUBLIC_KEY}, PRIVATE: ${!!process.env.EMAILJS_PRIVATE_KEY}`);
//             return false;
//         }

//         const data = {
//             service_id: process.env.EMAILJS_SERVICE_ID,
//             template_id: process.env.EMAILJS_TEMPLATE_ID,
//             user_id: process.env.EMAILJS_PUBLIC_KEY,
//             accessToken: process.env.EMAILJS_PRIVATE_KEY,
//             template_params: {
//                 to_name: to_name,
//                 email: to_email,
//                 passcode: otp,
//                 time: "5 minutes",
//                 message: `Your verification code is ${otp}.`
//             }
//         };

//         logToFile(`Request Data: ${JSON.stringify(data, null, 2)}`);

//         const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', data, {
//             headers: {
//                 'Content-Type': 'application/json'
//             }
//         });

//         logToFile(`EmailJS Success: ${JSON.stringify(response.data)}`);
//         return true;
//     } catch (error) {
//         const errorDetail = error.response ? JSON.stringify(error.response.data) : error.message;
//         logToFile(`EmailJS Error: ${errorDetail}`);
//         return false;
//     }
// };




// text/x-generic email.service.js ( ASCII text )
const axios = require('axios');

/**
 * Send Email using EmailJS REST API from Backend
 */
exports.sendOTPEmail = async (to_email, otp, to_name = "User") => {
    try {
        if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_PRIVATE_KEY) {
            return false;
        }

        const data = {
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            accessToken: process.env.EMAILJS_PRIVATE_KEY,
            template_params: {
                to_name: to_name,
                email: to_email, // Matches {{email}} in your 'To Email' field
                passcode: otp,   // Matches {{passcode}} in your template content
                time: "5 minutes", // Matches {{time}} in your template content
                message: `Your verification code is ${otp}.`
            }
        };


        const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

    
        return true;
    } catch (error) {
        return false;
    }
};