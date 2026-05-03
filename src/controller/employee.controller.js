import cloudinary from "../config/cloudinary.js";
import Employee from "../models/Employee.model.js";
import { genEmpId, genPassword } from "../utils/generator.js";
import bcrypt from "bcrypt"
import { sendEmployeeCredentials } from "../utils/nodemailer.js";
import Documents from "../models/Documents.model.js";
import Salary from "../models/Salary.model.js";

export const registerEmployee = async (req, res) => {
  try {
    const user = req.user
    if(user.role !== "HR"){
        return res.status(401).json({
            message: "Unauthorized Access"
        })
    }
    const {
      fullName,
      email,
      phone,
      dob,
      address,
      emergencyContact,
      faceVector,
      role,
      department,
      designation,
      reportingManager,
      joiningDate,
      employmentType
    } = req.body;

    const employeeId = await genEmpId();
    const password = await genPassword();
    const hashPassword = await bcrypt.hash(password, 12);

    const employee = await Employee.create({
      fullName,
      email,
      phone,
      dob,
      address,
      emergencyContact,
      faceVector,
      role,
      department,
      designation,
      reportingManager,
      joiningDate,
      employmentType,
      employeeId,
      password: hashPassword
    });

    sendEmployeeCredentials({
        to: email,
        fullName,
        employeeId,
        password
    }).catch(err => console.error("Failed to send credentials email:", err.message));

    res.status(201).json({
      message: "Employee Added",
      data: employee
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const getEmployeeDetails = async (req, res) => {
  try {
    const user = req.user;
    const employeeId = req.query.employeeId || req.body?.employeeId || user?.employeeId;

    if (user.employeeId !== employeeId && user.role !== "HR") {
      return res.status(401).json({
        message: "Unauthorized Access"
      });
    }

    if (!employeeId) {
      return res.status(400).json({
        message: "EmployeeId is Required"
      });
    }

    const employee = await Employee.findOne({ employeeId }).lean();
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Populate manager name if available
    if (employee.reportingManager) {
      const manager = await Employee.findOne({ employeeId: employee.reportingManager }).select('fullName email');
      if (manager) {
        employee.reportingManagerDetails = {
          name: manager.fullName,
          email: manager.email
        };
      }
    }

    res.status(200).json({
      message: "Request Successful",
      data: employee
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
};


export const handelDocuments = async (req, res) => {
  try {
    const user = req.user
    const {employeeId} = req.body
    if(user.employeeId !== employeeId){
        return res.status(401).json({
            message: "Unauthorized Access"
        })
    }
    
    if(!employeeId){
      return res.status(400).json({
        message: "Enter the EmployeeId"
      })
    }

    let documents = await Documents.findOne({employeeId})

    if(!documents){
      documents = new Documents({employeeId})
    }

    if (req.files?.idProof) {
      const result = await cloudinary.uploader.upload(req.files.idProof[0].path);
      documents.documents.idProof = result.secure_url;
    }

    if (req.files?.relievingLetter) {
      const result = await cloudinary.uploader.upload(req.files.relievingLetter[0].path);
      documents.documents.relievingLetter = result.secure_url;
    }

    if(!documents.documents.educationalCertificates){
      documents.documents.educationalCertificates = []
    }

    if(req.files?.educationalCertificates){
      for(let i = 0; i < req.files.educationalCertificates.length; i++){
        const result = await cloudinary.uploader.upload(req.files.educationalCertificates[i].path)
        documents.documents.educationalCertificates.push(result.secure_url)
      }
    }
    await documents.save()
    res.status(200).json({
      message: "Documents Uploaded"
    })
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

export const getEmployeeDocuments = async (req, res) => {
  try {
    const user = req.user
    const {employeeId} = req.body
    if(user.employeeId !== employeeId || user.role !== "HR"){
      return res.status(400).json({
        message: "Unauthorized Access"
      })
    }
    if(!employeeId){
      return res.status(400).json({
        message: "EmployeeId is Required"
      })
    }
    const document = await Documents.findOne({employeeId})
    res.status(200).json({
      message: "Request Successfull",
      data: document
    })
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: err.message });
  }
}

export const handelDocumentVerification = async (req, res) => {
  try {
    if(user.role !== "HR"){
        return res.status(401).json({
            message: "Unauthorized Access"
        })
    }
    const {employeeId, verificationStatus} = req.body
    if(!employeeId){
      return res.status(400).json({
        message: "EmployeeID is undefined"
      })
    }

    let document = await Documents.findOne({employeeId})
    document.verified = verificationStatus
    await document.save()
    res.status(200).json({
      message: "Verification Status Updated"
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: err.message });
  }
}

export const addSalary = async (req, res) => {
  try {
    const user = req.user
    if(user.role !== "HR"){
        return res.status(401).json({
            message: "Unauthorized Access"
        })
    }
    const {employeeId, hre, basicSalary, deductions, allowances} = req.body
    if(!employeeId){
      return res.status(400).json({
        message: "EmployeeID is undefined"
      })
    }
    const totalSalary = basicSalary + hre + allowances - deductions
    let salary = await Salary({employeeId})
    if(!salary) {
      salary = new Salary({employeeId})
    }
    if(basicSalary) salary.basicSalary = basicSalary
    if(hre) salary.hre = hre
    if(deductions) salary.deductions = deductions
    if(allowances) salary.allowances = allowances
    if(totalSalary) salary.totalSalary = totalSalary
    await salary.save()
    res.status(200).json({
      message: "Salary Updated",
      salary
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: err.message });
  }
}

export const getSalary = async (req, res) => {
  try {
    const user = req.user
    const {employeeId} = req.body
    if(user.employeeId !== employeeId || user.role !== "HR"){
      return res.status(400).json({
        message: "Unauthorized Access"
      })
    }
    if(!employeeId){
      return res.status(400).json({
        message: "EmployeeId is Required"
      })
    }
    const salary = await Salary.findOne({employeeId})
    res.status(200).json({
      message: "Request Successfull",
      data: salary
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: err.message });
  }
}