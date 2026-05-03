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

        const io = req.app.get("io");
        if (io) {
            io.emit("attendance_updated");
        }
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

export const getTodayStatus = async (req, res) => {
    try {
        const user = req.user;
        const employeeId = user.employeeId;
        const today = new Date().toISOString().split("T")[0];
        
        const attendance = await Attendance.findOne({
            employeeId,
            date: today
        });
        
        if (attendance) {
            return res.status(200).json({
                marked: true,
                checkInTime: attendance.checkInTime,
                checkOutTime: attendance.checkOutTime,
                status: attendance.status
            });
        } else {
            return res.status(200).json({
                marked: false
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getAllAttendance = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "HR") {
            return res.status(403).json({ message: "Unauthorized Access" });
        }

        const { page = 1, limit = 10, search = "", dept = "All", date = "" } = req.query;

        let matchStage = {};
        if (date) {
            matchStage.date = date; // "YYYY-MM-DD"
        }

        let pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: "employees",
                    localField: "employeeId",
                    foreignField: "employeeId",
                    as: "employeeDetails"
                }
            },
            { $unwind: "$employeeDetails" }
        ];

        if (search) {
            const searchRegex = new RegExp(search, "i");
            pipeline.push({
                $match: {
                    $or: [
                        { "employeeDetails.fullName": searchRegex },
                        { "employeeId": searchRegex }
                    ]
                }
            });
        }

        if (dept !== "All") {
            pipeline.push({
                $match: { "employeeDetails.department": dept }
            });
        }

        pipeline.push({ $sort: { date: -1, createdAt: -1 } });

        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await Attendance.aggregate(countPipeline);
        const totalRecords = countResult.length > 0 ? countResult[0].total : 0;
        const totalPages = Math.ceil(totalRecords / limit);

        const skip = (page - 1) * limit;
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });

        const records = await Attendance.aggregate(pipeline);

        const mappedRecords = records.map(record => {
            const inTime = record.checkInTime ? new Date(record.checkInTime) : null;
            const outTime = record.checkOutTime ? new Date(record.checkOutTime) : null;
            return {
                _id: record._id,
                employeeId: record.employeeId,
                employeeName: record.employeeDetails.fullName,
                department: record.employeeDetails.department,
                date: record.date,
                checkIn: inTime ? inTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
                checkOut: outTime ? outTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
                totalHours: record.workingHours ? `${record.workingHours}h` : '-',
                status: record.status,
                source: record.markedBy || "Unknown",
                locationInfo: record.markedBy === "Face" ? "Camera Verification" : (record.markedBy === "HR" ? "HR Override" : "-"),
                remarks: ""
            };
        });

        res.status(200).json({
            success: true,
            totalRecords,
            totalPages,
            currentPage: parseInt(page),
            records: mappedRecords
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
