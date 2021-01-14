const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const port = 5000;
const app = express();
const jwt = require('express-jwt');
const cookieParser = require('cookie-parser');
const jsonwebtoken = require('jsonwebtoken');
const multer = require('multer');

const crypto = require('crypto');

const base64JS = require('js-base64') ;
 const hmacSha256 = require('crypto-js/hmac-sha256') ;
 const encBase64 = require('crypto-js/enc-base64');


app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
// app.use('/uploads', express.static(path.join(__dirname, 'public')));
app.use("/public/uploads",express.static("public/uploads"));

const jwtsecret = "secret123";
var https = require('https');
// mongoose.connect("mongodb://localhost:27017/userDetails",{useNewUrlParser : true,useUnifiedTopology: true})
 mongoose.connect("mongodb+srv://admin-kumar:mongo@cluster0.eghgw.mongodb.net/userDetails?retryWrites=true&w=majority",{useNewUrlParser : true,useUnifiedTopology: true})
console.log(mongoose.connection.readyState);
// Scehma creation begins
const userSchema = new mongoose.Schema({
  Fname : String,
  Lname : String,
  Email : String,
  Password : String
});
const examSchema = new mongoose.Schema({
  Course_ID : String,
  Course_Name : String,
  Month_Name: String,
  Year: String,
  Exam_ID : String,
  Exam_Name : String,
  date:Date,
  Duration:String,
  QuestionBank:Array
});

const coursemonthSchema = new mongoose.Schema({
  Course_ID : String,
  Course_Name : String,
  Month_ID : String,
  Month_Name : String,
  Year:String

});

const userexamresponseSchema = new mongoose.Schema({
  userID : String,
  Exam_Name : String,
  userOptions:Array,
  userResults:Object
});

const imageSchema = new mongoose.Schema({
  imageName : {
    type : String,
    default:"none",
    required:true
  },
  imageData:{
    type:String,
    required:true
  }

});

const User = mongoose.model("User",userSchema);
const Exam = mongoose.model("Exam",examSchema);
const Coursemonth = mongoose.model("Coursemonth",coursemonthSchema);
const Userexamresponse = mongoose.model("Userexamresponse",userexamresponseSchema);
const Image = mongoose.model("Image",imageSchema);
// Schema creation ends

app.get("/",function(req,res){
  res.send("DB Test");
});


app.post("/logout",function(req,res){
res.clearCookie("token").send("cookie deleted");
console.log("cookie deleted");
// res.cookie('token', {}, {maxAge: -1});
// res.send({status:err.status,mesage:err.message});
});



// Register route begins
app.post("/register",register)

function register(req,res){
    User.findOne({Email:req.body.EmailAddress},function(err,user){
      console.log(req.body.EmailAddress,err,user);
        if(err){console.log(err)}
        else if(!user){
            const user = new User({
            Fname : req.body.FirstName,
            Lname : req.body.LastName,
            Email : req.body.EmailAddress,
            Password : req.body.Password
            });
            user.save(function(err,userdetails){
            if (err){console.log(err);}
            else{createJWT(req,res,userdetails,message="Registered Sucessfully")}
            })
        }
        else if(user){
          res.json({message : "User Already Exists"})
        }

    })
}

// Register route ends

// Login route begins

app.post("/login",login)

function login(req,res){
    User.findOne({Email:req.body.EmailAddress},function(err,user){
      console.log(req,req.body.EmailAddress,req.body.Password,err,user);
        if(err){console.log(err)}
        else if(!user){
            res.json({message : "User Not Registered"})
        }
        else if(user){
              if(req.body.Password === user.Password){createJWT(req,res,user,message="Login Successfull")}
              else{res.json({message : "Login Not Successfull"})}
        }

    })
}


//Login route ends


//CreateJWT Function begins

function createJWT(req,res,user,message){
  const token = jsonwebtoken.sign({user:user},jwtsecret,{ expiresIn: "600000" });
  res.cookie('token',token,{httpOnly:true});
  res.json({user:user,token:token,message:message});
  console.log(token,"request:");
}


//CreateJWT Funtion ends

// Authenticate route begins
app.post("/authenticate",function(req,res){
    if(req.cookies.token){
  // const decoded =jsonwebtoken.verify(req.cookies.token,jwtsecret);
  // console.log("decoded",jsonwebtoken.verify(req.cookies.token,jwtsecret));
        jsonwebtoken.verify(req.cookies.token,jwtsecret,function(err,decoded){
          console.log(decoded,"decoded");
          if(err){return res.json({message : "Not Valid token"})}
          else return res.json({message : "Authenticated",userID:decoded.user.Email})
        })
      }
    else return res.json({message : "Cookie CLeared"})
})

// Authenticate route ends

// uploadQuestionBank route begins
app.post("/uploadQuestionBank",uploadQuestionBank)

function uploadQuestionBank(req,res){
    Exam.findOne({Exam_ID:req.body.Exam_ID},function(err,examDetails){
      // console.log(req.body.Exam_ID,err,examDetails);
        if(err){console.log(err)}
        else if(!examDetails){
            const exam = new Exam({
              Course_ID : req.body.Course_ID,
              Course_Name : req.body.Course_Name,
              Exam_ID : req.body.Exam_ID,
              Exam_Name : req.body.Exam_Name,
              date: req.body.date,
              QuestionBank:req.body.QuestionBank
            });
            exam.save(function(err,examDetails){
            if (err){console.log(err);}
            else{res.json({message : "Exam Added Sucessfully"})}
            })
        }
        else if(examDetails){
          res.json({message : "Exam Already Exists"})
        }

    })
}



//uploadQuestionBank route ends


// Retrieve ExamMonths route begins
app.post("/RetrieveExamMonths",RetrieveExamMonths)

function RetrieveExamMonths(req,res){
  // console.log(req,req.body);
    Coursemonth.find({Course_ID:req.body.Course_ID},function(err,examMonthsDetails){
      // console.log(req.body.Course_ID,req.body.Exam_ID,err,examMonthsDetails);
        if(err){console.log(err)}
        else if(!examMonthsDetails){
            res.json({message : "No ExamMonths Exists"})
          }
        else if(examMonthsDetails){
          res.json({message : "ExamMonths Details Found",examMonthsDetails});
        }

    })
}



//Retrieve ExamMonths route ends

// RetrieveQuestionBank route begins
app.post("/RetrieveExamDetails",RetrieveExamDetails)

function RetrieveExamDetails(req,res){
  // console.log(req,req.body);
    Exam.find({Course_ID:req.body.Course_ID},function(err,examDetails){
      // console.log(req.body.Course_ID,req.body.Exam_ID,err,examDetails);
        if(err){console.log(err)}
        else if(!examDetails){
            res.json({message : "No Exam Exists"})
          }
        else if(examDetails){
          res.json({message : "Exam Details Found",examDetails});
        }

    })
}



//RetrieveQuestionBank route ends

// ExamSubmit route begins
app.post("/ExamSubmit",ExamSubmit)

function ExamSubmit(req,res){
  console.log(req.body);

const query = {userID: req.body.userID,Exam_Name:req.body.Exam_Name};
const update={$set:{userOptions:req.body.userInputArray,userResults:req.body.userResults}};
const options ={upsert: true};
// Userexamresponse.updateOne(query, update, options);
    Userexamresponse.updateOne(query, update, options,function(err,userexamresponses){
      console.log(req.body,err,userexamresponses);
        if(err){console.log(err)}
        else(res.json({message : "Useroptions Sucessfully Saved"}))
        // else if(!examDetails){
        //     res.json({message : "No Exam Exists"})
        //   }
        // else if(examDetails){
        //   res.json({message : "Exam Details Found",examDetails});
        // }

    })
}



//ExamSubmit route ends

// ExamSubmit route begins
app.post("/userExamExamResponses",userExamExamResponses)

function userExamExamResponses(req,res){
  console.log(req.body);

const query = {userID: req.body.userID,Exam_Name:req.body.Exam_Name};
// Userexamresponse.updateOne(query, update, options);
Userexamresponse.find(query,function(err,userexamresponses){
  // console.log(req.body.Course_ID,req.body.Exam_ID,err,examDetails);
    if(err){console.log(err)}
    else if(!userexamresponses){
        res.json({message : "Exam Not Attempted"})
      }
    else if(userexamresponses){
      res.json({message : "Exam Results Found",userexamresponses});
    }

})
}



//ExamSubmit route ends

//Image upload Route begins

const storage =multer.diskStorage({
destination: function (req,file,cb){cb(null,"public/uploads")},
filename: function (req,file,cb){cb(null,Date.now() + "-" +file.originalname)}

})

const upload = multer({storage:storage}).single("file");

app.post("/upload",function(req,res){

upload(req,res,function(err){
// console.log("reqfile",req.file,req.protocol+'://'+req.get('host')+'/public/'+req.file.filename);

      const imagePath =  req.protocol+'://'+req.get('host')+'/public/uploads/'+req.file.filename;
      const newImage = new Image({
      imageName:req.file.filename,
      imageData:imagePath
      });
        newImage.save()
            .then((result)=>{
              console.log(result);
            })
              .catch((err)=> {console.log(err)})





if(err instanceof multer.MulterError){return res.status(500).json(err)}
else if(err){return res.status(500).json(err)}
return res.status(200).send(req.file)


})


});
//Image upload Route ends

// Zoom Generate Signature Function begins
app.post("/ZoomGenerateSignature",generateSignature)

function generateSignature(req,res) {
console.log(req.body,"Zoom");
const apiKey = req.body.webinarDetails.apiKey;
const meetingNumber=req.body.webinarDetails.meetingNumber;
const role=req.body.webinarDetails.role;
const apiSecret=req.body.webinarDetails.apiSecret;
  // Prevent time sync issue between client signature generation and zoom
  const timestamp = new Date().getTime() - 30000
  const msg = Buffer.from(apiKey + meetingNumber + timestamp + role).toString('base64')
  const hash = crypto.createHmac('sha256', apiSecret).update(msg).digest('base64')
  const signature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64')

  res.json({message:"Signature Generation Successfull",signature:signature});
   console.log(signature);
}


//Zoom Generate Signature function ends







// app.use(jwt({secret:jwtsecret,getToken: req => req.cookies.token,algorithms: ['HS256']}));





app.listen(port,function(){

  console.log(`Server has started sucessfully on Port  ${port}`);
})
