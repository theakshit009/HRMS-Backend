import cron from 'node-cron'
import Employee from '../models/Employee.model.js'
import Attendance from '../models/Attendace.model.js'

cron.schedule("00 11 * * *", async() => {
    try {
        console.log("Cron is Running")
        const today = new Date().toISOString().split("T")[0]
        const employees = await Employee.find({ isActive: true})
        for(const employee of employees){
            const alreadyMarked = await Attendance.findOne({
                employeeId: employee.employeeId,
                date: today
            })
            if(!alreadyMarked){
                await Attendance.create({
                    employeeId: employee.employeeId,
                    date: today,
                    status: "Absent",
                    markedBy: "Auto"
                })
            }
        }
    } catch (error) {
        console.error(error)
    }
},{
    timezone: "Asia/Kolkata"
})