import Employee from "../models/Employee.model.js";
import Attendance from "../models/Attendace.model.js";

export const getHRDashboardStats = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "HR") {
            return res.status(403).json({ message: "Unauthorized Access" });
        }

        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        // 1. Top Stats
        const totalEmployees = await Employee.countDocuments();
        
        const todaysAttendances = await Attendance.find({ date: todayStr });
        const presentToday = todaysAttendances.length;
        const lateArrivals = todaysAttendances.filter(a => a.status === 'Late').length;
        
        const employees = await Employee.find({}, { faceVector: 1 });
        const pendingOnboarding = employees.filter(e => !e.faceVector || e.faceVector.length === 0).length;

        // 2. Attendance Trend (Last 7 Days)
        const attendanceTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

            const count = await Attendance.countDocuments({ date: dateStr, status: { $in: ['Present', 'Late', 'Half-Day'] } });
            const percentage = totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0;
            
            attendanceTrend.push({ name: dayName, percentage });
        }

        // 3. Department Breakdown
        const deptAgg = await Employee.aggregate([
            { $group: { _id: "$department", value: { $sum: 1 } } }
        ]);
        const departmentBreakdown = deptAgg.map(d => ({ name: d._id || "Unassigned", value: d.value }));

        // 4. Recent Activity
        const recentActivityAgg = await Attendance.aggregate([
            { $match: { date: todayStr } },
            { $sort: { checkInTime: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "employees",
                    localField: "employeeId",
                    foreignField: "employeeId",
                    as: "employee"
                }
            },
            { $unwind: "$employee" }
        ]);

        const recentActivity = recentActivityAgg.map(a => {
            const time = a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
            return {
                id: a._id.toString(),
                name: a.employee.fullName,
                time: time,
                status: a.status === 'Late' ? 'Late' : 'On Time'
            };
        });

        res.status(200).json({
            totalEmployees,
            presentToday,
            lateArrivals,
            pendingOnboarding,
            attendanceTrend,
            departmentBreakdown,
            recentActivity
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
