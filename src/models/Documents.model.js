import mongoose from "mongoose";
import { boolean } from "zod";

const DocumentSchema = new mongoose.Schema({
    employeeId:{
        type: String,
        required: true
    },
    documents: {
        idProof: String,
        educationalCertificates: [String],
        relivingLetter: String
    },
    verified: {
        type: boolean,
        default: false
    }
}, {timestamps:true})

const Documents =  mongoose.model("Documents", DocumentSchema)
export default Documents