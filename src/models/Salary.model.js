import mongoose from "mongoose";

const SalarySchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true
    },
    basicSalary: {
        type: Number,
        required: true,
    },
    allowances: {
        type: Number,
        required: true
    },
    hre: {
        type: Number,
        required: true,
    },
    deductions: {
        type: Number,
        required: true,
    },
    totalSalary: {
        type: Number,
        required: true,
    }
},{timestamps: true})

const Salary = mongoose.model("Salary", SalarySchema)
export default Salary