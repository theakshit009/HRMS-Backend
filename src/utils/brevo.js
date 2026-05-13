import { BrevoClient } from "@getbrevo/brevo";
import "dotenv/config";

const apiKey = process.env.BREVO_API_KEY || process.env.BREVO_Api;

if (!apiKey) {
    console.error("CRITICAL ERROR: Brevo API Key is missing! Please set BREVO_API_KEY in your environment variables.");
} else if (apiKey.startsWith('xsmtpsib-')) {
    console.warn("⚠️ WARNING: You are using a Brevo SMTP Key ('xsmtpsib-...') instead of a v3 API Key ('xkeysib-...'). This will cause 401 Unauthorized errors with the SDK.");
}

const brevo = new BrevoClient({ 
    apiKey: apiKey || "" 
});

const sender = {
    name: "HR Team",
    email: process.env.EMAIL_USER,
};

if (!sender.email) {
    console.warn("⚠️ WARNING: EMAIL_USER is not set. Emails may fail to send if sender email is missing.");
}

export const sendEmployeeCredentials = async ({ to, fullName, employeeId, password }) => {
    try {
        await brevo.transactionalEmails.sendTransacEmail({
            subject: "Your Employee Credentials",
            sender: sender,
            to: [{ email: to, name: fullName }],
            htmlContent: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2563eb;">Welcome to the Company, ${fullName} 🎉</h2>
                    <p>Your employee account has been successfully created.</p>

                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Login Credentials</h3>
                        <p><strong>Employee ID:</strong> ${employeeId}</p>
                        <p><strong>Password:</strong> ${password}</p>
                    </div>

                    <p style="color: #dc2626;">⚠️ Please change your password after first login.</p>

                    <br />
                    <p>Regards,<br/><strong>HR Team</strong></p>
                </div>
            `
        });
        console.log("Credentials email sent successfully to", to);
    } catch (error) {
        console.error("Error sending credentials email:", error);
        throw error;
    }
};

export const sendOTPEmail = async ({ to, fullName, otp }) => {
    try {
        await brevo.transactionalEmails.sendTransacEmail({
            subject: "Password Reset OTP",
            sender: sender,
            to: [{ email: to, name: fullName }],
            htmlContent: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2563eb;">Password Reset Request</h2>
                    <p>Hello ${fullName},</p>
                    <p>You requested a password reset. Use the OTP below to verify your identity:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <h1 style="font-size: 40px; letter-spacing: 10px; color: #2563eb; background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">${otp}</h1>
                    </div>
                    <p>This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
                    <br />
                    <p>Regards,<br/><strong>HR Team</strong></p>
                </div>
            `
        });
        console.log("OTP email sent successfully to", to);
    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw error;
    }
};
