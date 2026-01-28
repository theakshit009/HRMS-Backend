import Attendance from "../models/Attendace.model.js";
import Employee from "../models/Employee.model.js";
import LeaveModel from "../models/Leave.model.js";
import Salary from "../models/Salary.model.js";
import { generatePayrollPDF } from "../utils/payrollpdf.js";

export const calculatePayroll = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { month, year } = req.query;

    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

    const employees = await Employee.find({ isActive: true });

    const payroll = [];

    for (const emp of employees) {
      const attendance = await Attendance.find({
        employeeId: emp.employeeId,
        date: { $gte: start, $lte: end }
      });

      const leaves = await LeaveModel.find({
        employeeId: emp.employeeId,
        status: "approved",
        from: { $lte: end },
        to: { $gte: start }
      });

      const salaryData = await Salary.findOne({ employeeId: emp.employeeId });

      const present = attendance.filter(a => a.status === "Present").length;
      const absent = attendance.filter(a => a.status === "Absent").length;
      const unpaidLeaves = leaves.filter(l => l.type === "unpaid").length;

      const perDay = salaryData?.basicSalary / 30 || 0;
      const salary = Math.round(perDay * present);

      payroll.push({
        employeeId: emp.employeeId,
        name: emp.fullName,
        present,
        absent,
        unpaidLeaves,
        salary
      });
    }

    // ✅ STREAM PDF
    generatePayrollPDF(payroll, month, year, res);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payroll generation failed" });
  }
};




