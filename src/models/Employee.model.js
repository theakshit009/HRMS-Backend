import mongoose from 'mongoose';
import { type } from 'os';

const EmployeeSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  dob: { type: Date, required: true },
  address: { type: String, required: true },
  emergencyContact: { type: String},
  password: { type: String, required: true },
  employeeId: { type: String, unique: true, required: true },
  faceVector: {
    type: [Number],
    required: true
  },
  role: { 
    type: String, 
    enum: ['HR', 'Manager', 'Employee'], 
    default: 'Employee' 
  },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  reportingManager: { type: String }, // Stores Manager's Name or ID
  joiningDate: { type: Date, required: true },
  employmentType: { 
    type: String, 
    enum: ['Full-time', 'Intern', 'Contract'], 
    default: 'Full-time' 
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Employee = mongoose.model('Employee', EmployeeSchema);

export default Employee