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

const userSchema = new mongoose.Schema({
  Fname : String,
  Lname : String,
  Email : String,
  Password : String
});

const User = mongoose.model("User",userSchema);


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

// app.use(jwt({secret:jwtsecret,getToken: req => req.cookies.token,algorithms: ['HS256']}));





app.listen(port,function(){

  console.log(`Server has started sucessfully on Port  ${port}`);
})
