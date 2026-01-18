import expess from 'express'
import { addSalary, getEmployeeDetails, getEmployeeDocuments, getSalary, handelDocuments, handelDocumentVerification, registerEmployee } from '../controller/employee.controller.js'
import { upload } from '../config/multer.js'
import { validate } from '../middleware/validateRequest.js'
import { registerEmployeeSchema } from '../validators/employee.validator.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const hrRouter = expess.Router()

hrRouter.post('/onboard', authMiddleware, validate(registerEmployeeSchema), 
  registerEmployee)

hrRouter.get('/employeeDetails', authMiddleware, getEmployeeDetails)

hrRouter.post('/upload-documents', upload.fields([
    { name: "idProof", maxCount: 1 },
    { name: "relievingLetter", maxCount: 1 },
    { name: "educationalCertificates", maxCount: 5}
  ]), authMiddleware, handelDocuments)

hrRouter.get('/documents', authMiddleware, getEmployeeDocuments)

hrRouter.post('/dcoument-verification', authMiddleware, handelDocumentVerification)

hrRouter.post('/update-salary', authMiddleware, addSalary)

hrRouter.get('/salary', authMiddleware, getSalary)

export default hrRouter