import cron from 'node-cron'
import Employee from '../models/Employee.model.js'
import Attendance from '../models/Attendace.model.js'
import "dotenv/config"

// Calculate cron hour based on START_TIME (e.g., 10:00 -> 18:00)
const getCronSchedule = () => {
    const startTime = process.env.START_TIME || "09:00";
    const startHour = parseInt(startTime.split(':')[0]);
    const cronHour = (startHour + 8) % 24;
    return `00 ${cronHour} * * *`;
};

const cronSchedule = getCronSchedule();
console.log(`[Cron] Absent marking scheduled for ${cronSchedule.split(' ')[1]}:00 daily (8h after shift start)`);

cron.schedule(cronSchedule, async() => {
    try {
        console.log("Cron is Running: Marking absents for today")
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
        console.log("Cron finished successfully")
    } catch (error) {
        console.error("Cron Error:", error)
    }
},{
    timezone: "Asia/Kolkata"
})