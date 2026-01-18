import "dotenv/config"

export const checkAttendanceTime = (req, res, next) => {
    const now = new Date()

    const currentTime = now.getHours() * 60 + now.getMinutes()

    if(currentTime < process.env.START_TIME || currentTime > process.env.END_TIME){
        return res.status(400).json({
            message: `Attendance is only allowed between ${process.env.START_TIME} and ${process.env.END_TIME}`
        })
    }
    next()
}


export const officeIpCheck = (req, res, next) => {
     const officeIps = process.env.OFFICE_IP

     console.log(officeIps)

    let employeeIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress

    console.log(employeeIp)

    if(employeeIp.startsWith("::ffff:")){
        employeeIp = employeeIp.replace("::ffff:", "")
    }
    if(!officeIps.includes(employeeIp)){
        return res.status(400).json({
            message: "Attendance is only allowed through the office Ip Only"
        })
    }
    next()
}

