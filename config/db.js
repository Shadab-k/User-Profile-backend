const mongoose = require("mongoose")
const mongoURI="mongodb+srv://ShadabK:Shadab123@cluster0.mso5kbt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"


const connectToMongo = ()=>{
    mongoose.connect(mongoURI).then((res)=>{
        console.log("Connected To  Mongo Successfully")
    }).catch((error)=>{
        console.log('error encountered',error)
    });
       
    }

module.exports=connectToMongo;