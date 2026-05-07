import nodemailer from "nodemailer"
import "dotenv/config"
import dns from "dns"

// Force IPv4 as default for DNS resolution to avoid ENETUNREACH errors on Render
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

transporter.verify((err, success) => {
    if(err){
        console.log("SMTP Error:", err)
    } else {
        console.log("SMTP Ready")
    }
})

export const sendEmployeeCredentials = async ({to, fullName, employeeId, password}) => {
    const mail = {
        from: `"HR Team" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Your Employee Credentials",
        html: 
        `<h2>Welcome to the Company, ${fullName} 🎉</h2>
        <p>Your employee account has been successfully created.</p>

        <h3>Login Credentials</h3>
        <p><strong>Employee ID:</strong> ${employeeId}</p>
        <p><strong>Password:</strong> ${password}</p>

        <p>⚠️ Please change your password after first login.</p>

        <br />
        <p>Regards,<br/>HR Team</p>
        `
    }
    await transporter.sendMail(mail)
}

export const sendOTPEmail = async ({to, fullName, otp}) => {
    const mail = {
        from: `"HR Team" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Password Reset OTP",
        html: 
        `<h2>Password Reset Request</h2>
        <p>Hello ${fullName},</p>
        <p>You requested a password reset. Use the OTP below to verify your identity:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; color: #3b82f6;">${otp}</h1>
        <p>This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
        <br />
        <p>Regards,<br/>HR Team</p>
        `
    }
    await transporter.sendMail(mail)
}