import mongoose from  "mongoose";

const urlSchema = new mongoose.Schema({
    full_url:{
        type:String,
        required:true,
        
    },
    short_url:{
        type:String,
        required:true,
        unique:true,
        index:true
    },
    userClicks:{
        type:Number,
        default:0
    }
}
,{
    timestamps:true
})

const URL = mongoose.model("URL",urlSchema)

export default URL