import { 
    getAttendanceConfig, 
    updateAttendanceConfig, 
    resetAttendanceConfigToEnv, 
    getClientIp, 
    parseTimeToMinutes,
    getCurrentTimeInMinutes
} from "../utils/attendanceConfig.js";
import Employee from "../models/Employee.model.js";

const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * GET /api/v1/attendance/settings
 * Fetch current attendance settings (office IPs & timing), client IP, and authorization state
 */
export const getAttendanceSettings = async (req, res) => {
    try {
        const config = await getAttendanceConfig();
        const detectedIp = getClientIp(req);
        const isIpAllowed = config.officeIps.length === 0 || config.officeIps.includes(detectedIp);

        return res.status(200).json({
            success: true,
            settings: {
                officeIps: config.officeIps,
                startTime: config.startTime,
                endTime: config.endTime,
                isCustomConfigured: config.isCustomConfigured,
                updatedAt: config.updatedAt,
                updatedByName: config.updatedByName,
                envDefaults: config.envDefaults
            },
            clientInfo: {
                detectedIp,
                isIpAllowed
            }
        });
    } catch (error) {
        console.error("Error fetching attendance settings:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve attendance settings."
        });
    }
};

/**
 * PUT /api/v1/attendance/settings
 * Update office IPs and attendance start/end times (HR Only)
 */
export const updateAttendanceSettings = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== "HR") {
            return res.status(403).json({
                success: false,
                message: "Access Denied. Only HR accounts have the authority to update office network and attendance timings."
            });
        }

        const { officeIps, startTime, endTime } = req.body;

        // Validation for timings
        if (!startTime || !TIME_REGEX.test(startTime)) {
            return res.status(400).json({
                success: false,
                message: "Valid start time in HH:MM (24-hour) format is required (e.g., 09:00)."
            });
        }

        if (!endTime || !TIME_REGEX.test(endTime)) {
            return res.status(400).json({
                success: false,
                message: "Valid end time in HH:MM (24-hour) format is required (e.g., 18:00)."
            });
        }

        const startMin = parseTimeToMinutes(startTime);
        const endMin = parseTimeToMinutes(endTime);

        if (startMin >= endMin) {
            return res.status(400).json({
                success: false,
                message: "End time must be later than start time."
            });
        }

        // Fetch employee details for audit trail
        let employeeInfo = {
            id: user.id,
            employeeId: user.employeeId,
            fullName: "HR Admin",
            email: ""
        };

        try {
            const emp = await Employee.findById(user.id);
            if (emp) {
                employeeInfo.fullName = emp.fullName;
                employeeInfo.email = emp.email;
            }
        } catch (e) {
            console.warn("Could not find employee record for audit:", e.message);
        }

        const updatedConfig = await updateAttendanceConfig({
            officeIps: officeIps || [],
            startTime,
            endTime,
            user: employeeInfo
        });

        // Notify connected clients via Socket.IO
        const io = req.app.get("io");
        if (io) {
            io.emit("attendance_settings_updated", {
                officeIps: updatedConfig.officeIps,
                startTime: updatedConfig.startTime,
                endTime: updatedConfig.endTime,
                updatedAt: updatedConfig.updatedAt
            });
        }

        return res.status(200).json({
            success: true,
            message: "Office IP and attendance timing settings updated successfully.",
            settings: updatedConfig
        });
    } catch (error) {
        console.error("Error updating attendance settings:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update attendance settings."
        });
    }
};

/**
 * POST /api/v1/attendance/settings/reset
 * Reset custom configuration to environment variable defaults (HR Only)
 */
export const resetAttendanceSettings = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== "HR") {
            return res.status(403).json({
                success: false,
                message: "Access Denied. Only HR accounts have the authority to reset settings."
            });
        }

        const defaultConfig = await resetAttendanceConfigToEnv();

        const io = req.app.get("io");
        if (io) {
            io.emit("attendance_settings_updated", {
                officeIps: defaultConfig.officeIps,
                startTime: defaultConfig.startTime,
                endTime: defaultConfig.endTime,
                updatedAt: defaultConfig.updatedAt
            });
        }

        return res.status(200).json({
            success: true,
            message: "Attendance settings successfully reset to environment variable defaults.",
            settings: defaultConfig
        });
    } catch (error) {
        console.error("Error resetting attendance settings:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reset attendance settings."
        });
    }
};

/**
 * GET /api/v1/attendance/pre-check
 * Real-time pre-check for employee face attendance (validates real client IP and shift time window)
 */
export const preCheckAttendance = async (req, res) => {
    try {
        const config = await getAttendanceConfig();
        const detectedIp = getClientIp(req);
        const isIpAllowed = !config.officeIps || config.officeIps.length === 0 || config.officeIps.includes(detectedIp);

        const currentTime = getCurrentTimeInMinutes();
        const startTime = parseTimeToMinutes(config.startTime);
        const endTime = parseTimeToMinutes(config.endTime);
        const isTimeAllowed = currentTime >= startTime && currentTime <= endTime;

        return res.status(200).json({
            success: true,
            network: {
                allowed: isIpAllowed,
                detectedIp,
                message: isIpAllowed 
                    ? `Office Network Authorized (${detectedIp})` 
                    : `IP Mismatch: Detected IP (${detectedIp}) is not an authorized office network.`
            },
            time: {
                allowed: isTimeAllowed,
                startTime: config.startTime,
                endTime: config.endTime,
                message: isTimeAllowed 
                    ? `Shift Window Active (${config.startTime} - ${config.endTime})` 
                    : `Shift Window Closed: Attendance is only permitted between ${config.startTime} and ${config.endTime}.`
            },
            canMarkAttendance: isIpAllowed && isTimeAllowed
        });
    } catch (error) {
        console.error("Pre-check Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to perform attendance pre-check."
        });
    }
};
