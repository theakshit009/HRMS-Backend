import Attendance from "../models/Attendace.model.js"
import Employee from "../models/Employee.model.js"
import { cosineSimilarity } from "../utils/faceMatching.js"

export const markAttendanceByFace = async (req, res) =>{
    try {
        const user = req.user
        const employeeId = user.employeeId
        const {faceVector} = req.body
        if(!employeeId || !faceVector) {
            return res.status(400).json({
                message: "EmployeeId & Face Vector is required"
            })
        }
        const today = new Date().toISOString().split("T")[0]

        const alreadyMarked = await Attendance.findOne({
            employeeId,
            date: today
        })
        if(alreadyMarked){
            return res.status(400).json({
                message: "Attendance Already marked!!"
            })
        }
        const employee = await Employee.findOne({employeeId})

        if(!employee || !employee.faceVector){
            return res.status(400).json({
                message: "Employee or face Data is not Found"
            })
        }
        const similar = cosineSimilarity(faceVector, employee.faceVector)
        if(similar < 0.95){
            return res.status(400).json({
                messgae: "Face not matched"
            })
            console.log("Face matched")
        }
        await Attendance.create({
            employeeId,
            date: today,
            faceMatchScore: similar,
            status: "Present",
            markedBy: "Face"
        })
        res.status(200).json({
            message: "Attendance marked successfully"
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

export const markAttendanceByHR = async (req, res) => {
    try {
        const user = req.user
        if(user.role !== "HR"){
            return res.status(400).json({
                message: "Unauthorized Access"
            })
        }
        const {employeeId, status} = req.body
        const today = new Date().toISOString().split("T")[0]

        const alreadyMarked = await Attendance.findOne({
            employeeId,
            date: today
        })

        if(alreadyMarked){
            return res.status(400).json({
                message: "Attendance Already Marked"
            })
        }

        await Attendance.create({
            employeeId,
            date: today,
            status,
            markedBy: "HR"
        })
        res.status(200).json({
            message: "Attendace Marked Successfully"
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

export const checkoutEmployee = async (req, res) => {
    try {
        const user = req.user
        const {employeeId} = req.body
        if(user.employeeId !== employeeId){
            return res.status(400).json({
                message: "Unauthorized Access"
            })
        }
        const today = new Date().toISOString().split("T")[0]
        const attendance = await Attendance.findOne({
            employeeId,
            date: today
        })
        if(!attendance){
            return res.status(400).json({
                message: "No Attendance found for today"
            })
        }
        if(attendance.status === 'Absent'){
            return res.status(400).json({
                message: "You are not marked present today"
            })
        }
        if(attendance.checkOutTime){
            return res.status(400).json({
                message: "Your checkout is already done!"
            })
        }
        attendance.checkOutTime = new Date()

        const workingHours = ((attendance.checkOutTime - attendance.checkInTime) / (1000 * 60 * 60)).toFixed(2)

        attendance.workingHours = Number(workingHours)
        await attendance.save()
        res.status(200).json({
            message: "Checkout Done Successfully",
            checkOutTime: attendance.checkOutTime
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

export const getAttendanceByMonth = async (req, res) => {
    try {
        const user = req.user
        const {month, year, employeeId} = req.query
        if(user.role !== "HR"){
            if(user.employeeId !== employeeId){
                return res.status(400).json({
                    message: "Unauthorized Access"
                })
            }
        }
        const monthStr = `${year}-${month.padStart(2, "0")}`

        const attendance = await Attendance.find({
            employeeId,
            date: {$regex: `^${monthStr}`}
        }).sort({date: 1})

        const totalDays = attendance.length
        const presentDays = attendance.filter(a => a.status === "Present").length
        const absentDays = attendance.filter(a => a.status === "Absent").length

        res.status(200).json({
            month,
            year,
            summary: {
                totalDays,
                presentDays,
                absentDays
            },
            records: attendance
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

