import nodemailer from "nodemailer"
import "dotenv/config"

export const sendEmployeeCredentials = async ({to, fullName, employeeId, password}) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        family: 4, // forces IPv4
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000
    })
    const mail = {
        from: `"HR Team <${process.env.EMAIL_USER}`,
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