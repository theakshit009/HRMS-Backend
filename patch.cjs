const fs = require('fs');

let content = fs.readFileSync('src/controller/attendance.controller.js', 'utf8');

const ioCode = `
        const io = req.app.get("io");
        if (io) {
            io.emit("attendance_updated");
        }
`;

content = content.replace(/        await Attendance\.create\(\{\n            employeeId,\n            date: today,\n            faceMatchScore: similar,\n            status: "Present",\n            markedBy: "Face"\n        \}\)\r?\n/g, 
`        await Attendance.create({
            employeeId,
            date: today,
            faceMatchScore: similar,
            status: "Present",
            markedBy: "Face"
        })
${ioCode}`);

content = content.replace(/        await Attendance\.create\(\{\n            employeeId,\n            date: today,\n            status,\n            markedBy: "HR"\n        \}\)\r?\n/g, 
`        await Attendance.create({
            employeeId,
            date: today,
            status,
            markedBy: "HR"
        })
${ioCode}`);

content = content.replace(/        await attendance\.save\(\)\r?\n/g, 
`        await attendance.save()
${ioCode}`);

fs.writeFileSync('src/controller/attendance.controller.js', content);
console.log("Patched attendance.controller.js");
