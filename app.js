const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const port = 5000;
const app = express();
const jwt = require('express-jwt');
const cookieParser = require('cookie-parser');
const jsonwebtoken = require('jsonwebtoken');

app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());

const jwtsecret = "secret123";
var https = require('https');
mongoose.connect("mongodb://localhost:27017/userDetails",{useNewUrlParser : true,useUnifiedTopology: true})
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
const User = mongoose.model("User",userSchema);
const Exam = mongoose.model("Exam",examSchema);
const Coursemonth = mongoose.model("Coursemonth",coursemonthSchema);
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

app.post("/home",function(req,res){
// const reqdata = JSON.parse(req)
//   const decoded = jsonwebtoken.verify(req.cookies.token,jwtsecret);
//   const date = new Date(parseInt(decoded.iat)*1000);
// console.log({req},"deocedvalue:",decoded,"iat",date,"cookie:",req.cookies.token);
// console.log({req.body});
// inseting the data ino=to the db
  const user = new User({
    Fname : req.body.Fname,
    Lname : req.body.Lname,
    Email : req.body.Email,
    Password : req.body.Password
  });
  // saving the result
  user.save(function(err,result){
    if (err){console.log(err);}
    else{console.log(result)}
})
 res.send("request receievd");
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
  const token = jsonwebtoken.sign({user:user},jwtsecret,{ expiresIn: "60000" });
  res.cookie('token',token,{httpOnly:true});
  res.json({user:user,token:token,message:message});
  console.log(token,"request:");
}


//CreateJWT Funtion ends

// Authenticate route begins
app.post("/authenticate",function(req,res){
    if(req.cookies.token){
  // const decoded =jsonwebtoken.verify(req.cookies.token,jwtsecret);
        jsonwebtoken.verify(req.cookies.token,jwtsecret,function(err,decoded){
          if(err){return res.json({message : "Not Valid token"})}
          else return res.json({message : "Authenticated"})
        })
      }
    else return res.json({message : "Cookie CLeared"})
})

// Authenticate route ends

// uploadQuestionBank route begins
app.post("/uploadQuestionBank",uploadQuestionBank)

function uploadQuestionBank(req,res){
    Exam.findOne({Exam_ID:req.body.Exam_ID},function(err,examDetails){
      console.log(req.body.Exam_ID,err,examDetails);
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
  console.log(req,req.body);
    Coursemonth.find({Course_ID:req.body.Course_ID},function(err,examMonthsDetails){
      console.log(req.body.Course_ID,req.body.Exam_ID,err,examMonthsDetails);
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
app.post("/RetrieveQuestionBank",RetrieveQuestionBank)

function RetrieveQuestionBank(req,res){
  console.log(req,req.body);
    Exam.find({Course_ID:req.body.Course_ID},function(err,examDetails){
      console.log(req.body.Course_ID,req.body.Exam_ID,err,examDetails);
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




// app.use(jwt({secret:jwtsecret,getToken: req => req.cookies.token,algorithms: ['HS256']}));





app.listen(port,function(){

  console.log(`Server has started sucessfully on Port  ${port}`);
})
