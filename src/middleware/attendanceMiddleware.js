import "dotenv/config"

const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

export const checkAttendanceTime = (req, res, next) => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    const startTime = parseTimeToMinutes(process.env.START_TIME);
    const endTime = parseTimeToMinutes(process.env.END_TIME);

    if (currentTime < startTime || currentTime > endTime) {
        return res.status(400).json({
            message: `Attendance is only allowed between ${process.env.START_TIME} and ${process.env.END_TIME}`
        })
    }
    next()
}


export const officeIpCheck = (req, res, next) => {
    const officeIpsString = process.env.OFFICE_IP || ""
    const allowedIps = officeIpsString.split(",").map(ip => ip.trim())

    // req.ip is populated by Express, and since we set 'trust proxy', 
    // it will correctly pick up the client's public IP from X-Forwarded-For
    let employeeIp = req.ip

    // Handle IPv6 localhost and normalization if necessary
    if (employeeIp === "::1") employeeIp = "127.0.0.1"
    if (employeeIp && employeeIp.startsWith("::ffff:")) {
        employeeIp = employeeIp.replace("::ffff:", "")
    }

    if (!allowedIps.includes(employeeIp)) {
        console.log(`[IP Check Failed] Access denied for IP: ${employeeIp}. Allowed IPs: ${allowedIps.join(", ")}`)
        return res.status(400).json({
            message: "Attendance is only allowed through the office network (IP Mismatch)",
            detectedIp: employeeIp // Optional: help user identify their current IP
        })
    }
    next()
}
