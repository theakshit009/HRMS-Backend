import mongoose from "mongoose";

const AttendanceConfigSchema = new mongoose.Schema({
    officeIps: {
        type: [String],
        default: []
    },
    startTime: {
        type: String,
        required: true,
        default: "09:00"
    },
    endTime: {
        type: String,
        required: true,
        default: "18:00"
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null
    },
    updatedByName: {
        type: String,
        default: "System"
    },
    updatedByEmail: {
        type: String,
        default: ""
    }
}, { timestamps: true });

const AttendanceConfig = mongoose.model("AttendanceConfig", AttendanceConfigSchema);

export default AttendanceConfig;
