import crypto from "crypto"
import Employee from "../models/Employee.model.js"

export const genPassword = (lenght = 8) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&";
    let password = "";
    for(let i = 0; i < lenght; i++){
        password += chars.charAt(crypto.randomInt(0, chars.length));
    }
    return password
}

export const genEmpId = async () => {
    const currYear = new Date().getFullYear()
    const prefix = ` EMP${currYear}`

    const lastUser = await Employee.findOne({
        employeeId: {$regex: `^${prefix}`}
    }).sort({createdAt: -1}).select('employeeId')

    let newSeq = "001"

    if(lastUser && lastUser.employeeId){
        const lastSeqStr = lastUser.employeeId.slice(-3)
        const lastSeqNum = parseInt(lastSeqStr, 10)

        if(!isNaN(lastSeqNum)){
            newSeq = (lastSeqNum + 1).toString().padStart(3, "0")
        }
    }
    return `${prefix}${newSeq}`
}

