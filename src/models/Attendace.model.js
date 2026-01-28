import mongoose from "mongoose";
import { type } from "os";

const AttendanceSchema = new mongoose.Schema({
    employeeId:{
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    checkInTime:{
        type: Date,
        default: Date.now
    },
    checkOutTime: {
        type: Date,
    },
    status: {
        type: String,
        enum: ["Present", "Late", "Absent"],
        default: "Present"
    },
    faceMatchScore: {
        type: Number,
    },
    workingHours: {
        type: Number,
    },
    markedBy: {
        type: String,
        enume: ["Face", "HR", "Auto"],
        default: "Face"
    }
}, {
    timestamps: true
})

AttendanceSchema.index(
    {employeeId: 1, date: 1},
    {unique: true}
)

const Attendance = mongoose.model("Attendance", AttendanceSchema)

export default Attendance