import jwt from "jsonwebtoken"
import Employee from "../models/Employee.model.js"
import bcrypt from "bcrypt"
import "dotenv/config"
import { sendOTPEmail } from "../utils/nodemailer.js"

export const userLogin = async (req, res) => {
    try {
        const {email, password} = req.body
        if(!email || !password){
            return res.status(400).json({
                message: "Email and Password are Required"
            })
        }
        const employee = await Employee.findOne({email})
        if(!employee) {
            return res.status(400).json({
                message: "Invalid Email"
            })
        }
        const isMatch = await bcrypt.compare(password, employee.password)
        if(!isMatch){
            return res.status(400).json({
                message: "Incorrect Password"
            })
        }
        const token = jwt.sign(
            {
                id: employee._id,
                role: employee.role,
                employeeId: employee.employeeId
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN
            }
        )
        res.status(200).json({
            message: "Login Successfully",
            token,
            employee: {
                id: employee._id,
                email: employee.email,
                role: employee.role,
                employeeId: employee.employeeId
            }
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
}


export const changePassword = async (req, res) => {
    try {
        // Use req.user.id from authMiddleware
        const { oldPassword, newPassword } = req.body;
        
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Old and new passwords are required" });
        }

        const employee = await Employee.findById(req.user.id);
        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        const isMatch = await bcrypt.compare(oldPassword, employee.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Incorrect Old Password"
            });
        }

        const hashPassword = await bcrypt.hash(newPassword, 12);
        employee.password = hashPassword;
        await employee.save();

        res.status(200).json({
            message: "Password Changed Successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const employee = await Employee.findOne({ email });

        if (!employee) {
            return res.status(404).json({ message: "Employee not found with this email" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        employee.resetPasswordOTP = otp;
        employee.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000;
        await employee.save();

        sendOTPEmail({ to: email, fullName: employee.fullName, otp });

        res.status(200).json({ message: "OTP sent to your email" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        const employee = await Employee.findOne({ 
            email,
            resetPasswordOTP: otp,
            resetPasswordOTPExpires: { $gt: Date.now() }
        });

        if (!employee) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const hashPassword = await bcrypt.hash(newPassword, 12);
        employee.password = hashPassword;
        employee.resetPasswordOTP = undefined;
        employee.resetPasswordOTPExpires = undefined;
        await employee.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};