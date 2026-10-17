import { getAttendanceConfig, getClientIp, parseTimeToMinutes } from "../utils/attendanceConfig.js";

export const checkAttendanceTime = async (req, res, next) => {
    try {
        const config = await getAttendanceConfig();
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const startTime = parseTimeToMinutes(config.startTime);
        const endTime = parseTimeToMinutes(config.endTime);

        if (currentTime < startTime || currentTime > endTime) {
            return res.status(400).json({
                message: `Attendance is only allowed between ${config.startTime} and ${config.endTime}`
            });
        }
        next();
    } catch (error) {
        console.error("Attendance time check error:", error);
        next(error);
    }
};

export const officeIpCheck = async (req, res, next) => {
    try {
        const config = await getAttendanceConfig();
        const allowedIps = config.officeIps || [];

        // If no IPs configured anywhere, allow or proceed
        if (allowedIps.length === 0) {
            return next();
        }

        const employeeIp = getClientIp(req);

        if (!allowedIps.includes(employeeIp)) {
            console.log(`[IP Check Failed] Access denied for IP: ${employeeIp}. Allowed IPs: ${allowedIps.join(", ")}`);
            return res.status(400).json({
                message: "Attendance is only allowed through the office network (IP Mismatch)",
                detectedIp: employeeIp
            });
        }
        next();
    } catch (error) {
        console.error("Office IP check error:", error);
        next(error);
    }
};
