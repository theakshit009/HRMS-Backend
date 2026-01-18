import jwt from "jsonwebtoken"
import Employee from "../models/Employee.model.js"
import bcrypt from "bcrypt"
import "dotenv/config"

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
        const userId = req.user.id
        const {password, oldPassword} = req.body
        const employee = await Employee.findById(userId)
        if(!employee){
            return res.status(400).json({
                message: "Employee not found"
            })
        }
        const isMatch = await bcrypt.compare(oldPassword, employee.password)
        if(!isMatch){
            return res.status(400).json({
                message: "Incorrect Old Password"
            })
        }
        const hashPassword = await bcrypt.hash(password, 12)
        employee.password = hashPassword
        await employee.save()
        res.status(200).json({
            message: "Password Changed Successfully"
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Internal Server Error"
        }) 
    }
}