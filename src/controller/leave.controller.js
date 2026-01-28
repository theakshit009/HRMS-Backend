import Employee from "../models/Employee.model.js";
import LeaveModel from "../models/Leave.model.js";

export const applyLeave = async (req, res) => {
  try {
    const { type, from, to, reason } = req.body;
    const user = req.user;

    const leave = await LeaveModel.create({
      employeeId: user.employeeId,
      type,
      from,
      to,
      reason
    });

    return res.status(201).json({
      success: true,
      message: "Leave request submitted",
      leave
    });

  } catch (err) {
    res.status(500).json({ message: "Failed to apply leave" });
  }
};

export const myLeaves = async (req, res) => {
  try {
    const leaves = await LeaveModel.find({
        employeeId: req.employeeId
    }).sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error(error)
    res.status(500).json({
        message: "Internal Server Error"
    })
  }
};

export const getLeaveBalnce = async (req, res) => {
    try {
        const user = req.user
        const {employeeId} = req.body
        if(user.role !== "HR" && user.role !== "Manager"){
            if(user.employeeId !== employeeId){
                return res.status(400).json({
                    message: "Unauthorized Access"
                })
            }
        }
        const leaves = await Employee.find({employeeId})
        res.json(leaves.leaveBalance)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
} 

export const approveLeave = async (req, res) => {
  try {
    const user = req.user
    if(user.role !== "HR" || user.role !== "Manager"){
      return res.status(400).json({
        message: "Unauthorized Access"
      })
    }
    const leave = await LeaveModel.findById(req.params.leaveId);

    if (!leave) return res.status(404).json({ message: "Leave not found" });

    const employee = await Employee.findById(leave.employeeId);

    const days = (new Date(leave.to) - new Date(leave.from)) / (1000 * 60 * 60 * 24) + 1;

    if (leave.type !== "unpaid") {
      if (employee.leaveBalance[leave.type] < days) {
        return res.status(400).json({ message: "Insufficient leave balance" });
      }
      employee.leaveBalance[leave.type] -= days;
    }

    leave.status = "approved";
    leave.approvedBy = req.user.employeeId;
    leave.approvedAt = new Date();

    await leave.save();
    await employee.save();

    res.json({ message: "Leave approved successfully" });
  } catch (error) {
    console.error(error)
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

export const rejectLeave = async (req, res) => {
  try {
    const user = req.user
    if(user.role !== "HR" || user.role !== "Manager"){
      return res.status(400).json({
        message: "Unauthorized Access"
      })
    }
    await LeaveModel.findByIdAndUpdate(req.params.leaveId, {
    status: "rejected",
    approvedBy: req.user._id,
    approvedAt: new Date()
  });

  res.json({ message: "Leave rejected" });

  } catch (error) {
    console.error(error)
    res.status(500).json({
        message: "Internal Server Error"
    })
  }
};

export const pendingLeaves = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "Manager") {
      return res.status(403).json({
        message: "Unauthorized Access"
      });
    }
    
    const employees = await Employee.find({
      reportingManager: user.employeeId
    });

    const employeeIds = employees.map(emp => emp._id);

    const leaves = await LeaveModel.find({
      employeeId: { $in: employeeIds },
      status: "pending"
    }).populate("employeeId", "fullName employeeId");

    return res.status(200).json(leaves);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};




