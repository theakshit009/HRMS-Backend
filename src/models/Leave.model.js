import mongoose from "mongoose";
import { type } from "os";

const leaveSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: ["casual", "sick", "paid", "unpaid"],
    required: true
  },

  from: {
    type: Date,
    required: true
  },

  to: {
    type: Date,
    required: true
  },

  reason: String,

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee"
  },

  approvedAt: Date,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Leave", leaveSchema);
