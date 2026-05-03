import {z} from "zod"

export const registerEmployeeSchema = z.object({
    fullName: z.string().min(1, "Name is Required"),
    email: z.email(),
    phone: z.string().min(10),
    dob: z.string(),
    address: z.string().min(5).optional(),
    emergencyContact: z.string().min(10).optional(),
    faceVector: z.array(z.number()),
    role: z.enum([
        "HR",
        "Manager",
        "Employee"
    ]),
    department: z.string(),
    designation: z.string(),
    reportingManager: z.string(),
    joiningDate: z.string(),
    employmentType: z.enum([
        'Full-time', 'Intern', 'Contract'
  ]),
})