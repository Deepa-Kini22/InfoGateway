var createError = require('http-errors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressValidator = require('express-validator');
var flash = require('express-flash');
var session = require('express-session');
var bodyParser = require('body-parser');
var con = require("./models/db");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { PORT } = require("./config");
const express = require("express");
const queueRoutes = require("./routes/queueRoutes");
const fs = require("fs");
const soap = require("soap");



const { MAIL_URL, MAIL_KEY, FROM_MAIL, FROM_NAME } = require("./config");
const messageTemplete = require("./templates/emailTemplates");
const messageFunc = require("./models/standardMessaging");



const app = express();

// parse requests of content-type: application/json
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// simple route
app.get("/", (req, res) => {
    res.json({ message: "Welcome to Infomate server!!!" });
});

app.use("/api", queueRoutes);
app.use("/superadmin", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/auth", "login.html"));
});

app.use("/home", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/auth", "home.html"));
});

app.use("/useradmin", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/auth", "userlogin.html"));
});
app.use("/userhome", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/auth", "userhome.html"));
});

app.use("/logout", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/auth", "login.html"));
});


app.post("/admin_login", async function (req, res) {
    var Pub_Sub_Id = req.body.Pub_Sub_Id;

    //console.log(req.body);
    con.query(
        "SELECT * FROM infomatics.messaging_gateway_register WHERE Pub_Sub_Id = ? and `status`=9",
        [Pub_Sub_Id],
        async function (error, results, fields) {
            //console.log(results);
            if (error) {
                res.send({
                    code: 400,
                    failed: "error occurred",
                    error: error,
                });
            } else {
                if (results.length > 0) {
                    res.send({
                        code: 200,
                        success: "login successful",
                        Pub_Sub_Id: results[0].Pub_Sub_Id,
                    });


                } else {
                    res.send({
                        code: 206,
                        error: "Pub Sub Id does not exist",
                    });
                }
            }
        }
    );
});


app.post("/register", async function (req, res) {
    //console.log(req.body);
    const User_Name = req.body.User_Name;
    const Password = req.body.Password;
    const encryptedPassword = await bcrypt.hash(Password, saltRounds);
    let users = {
        Application_Name: App_Name,
        Application_User_Name: User_Name,
        Application_Password: encryptedPassword,
    };
    con.query(
        "INSERT INTO infomatics.app_register SET ?",
        users,
        function (error, results, fields) {
            if (error) {
                res.send({
                    code: 400,
                    failed: "error occurred",
                    error: error,
                });
            } else {
                res.send({
                    code: 200,
                    success: "user registered sucessfully",
                });
            }
        }
    );
});




app.post("/registerApp", async function (req, res) {

    function makeid(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *
                charactersLength));
        }
        return result;
    }
    var verifyOtp = makeid(4);
    var appname = req.body.appname;
    var appUrl = req.body.appUrl;
    var phoneNumber = req.body.phoneNumber;
    var emailid = req.body.emailid;
    var status = req.body.status;
    var systemUserId = req.body.systemUserId;
    //console.log(verifyOtp, appname, appUrl, phoneNumber, emailid, status, systemUserId);
    var sql = `CALL usp_newAppRegsitartion('${appname}','${appUrl}','${phoneNumber}','${emailid}','${status}','${systemUserId}','${verifyOtp}')`
    //console.log(sql);
    con.query(
        sql,
        async function (error, results, fields) {
            if (error) {
                res.send({
                    code: 400,
                    failed: "error occurred",
                    error: error,
                });
            } else {

                //console.log(results[0][0].log);
                if (results.length > 0) {
                    if (results[0][0].log == 'Successfull') {
                        res.send({
                            code: 200,
                            success: "Inserted successfully!!!",
                        });
                        var msgTemplete = messageTemplete.AppPubSubId({
                            pubSubKey: results[0][0].Pub_Sub_Id,
                            verifyOtp: verifyOtp,
                            emailId: results[0][0].Email_Id
                        });

                        messageFunc.sendPubSubId(
                            { email: results[0][0].Email_Id, pubSubKey: results[0][0].Pub_Sub_Id, verifyOtp: verifyOtp },
                            "Infomate Team- Welcome to Infomate Server",
                            msgTemplete
                        );

                    }
                    else if (results[0][0].log == 'Exsists') {
                        res.send({
                            code: 204,
                            success: "Exists!!!",
                        });
                    }
                    else if (results[0][0].log == 'Email-Id/Phone Number Already Exsits') {
                        res.send({
                            code: 204,
                            success: "Email-Id/Phone Number Exsits!!!",
                        });
                    }


                } else {
                    res.send({
                        code: 204,
                        error: "Application Already Exists!!!",
                    });
                }
            }
        }
    );
});


const request = require('request');
const { Console } = require('console');

const options = {
    method: 'GET',
    url: `https://api.kapsystem.com/api/v3/sendsms/plain?user=deepaapcog&password=Apcogsysdeepakini221995!&sender=SOWNET&SMSText=test&type=longsms&GSM=` + 8867636073,
    qs: { username: 'deepaapcog', password: 'Apcogsysdeepakini221995!', cmd: 'X' },
    headers: {
        'x-rapidapi-key': 'd0e5a05f32msh0517f137fcd0c5ep1ea71ajsnd687fc161fd5',
        'x-rapidapi-host': 'kapsystem-bulksmsapi-v1.p.rapidapi.com',
        useQueryString: true
    }
};








app.post("/updatePassword", async function (req, res) {
    var User_Url = req.body.User_Url;
    var currentPassword = req.body.currentPassword;
    var newPassword = req.body.newPassword;
    var msgTemplete = messageTemplete.changePassword({
        newPassword: newPassword
    });


    //console.log(req.body);
    con.query(
        "SELECT * FROM infomatics.app_register WHERE Application_Url = ? ",
        [User_Url],
        async function (error, results, fields) {
            if (error) {
                res.send({
                    code: 400,
                    failed: "error occurred",
                    error: error,
                });
            } else {
                if (results.length > 0) {
                    // console.log(results[0].Email_Id);
                    const comparison = await bcrypt.compare(
                        currentPassword,
                        results[0].Password
                    );
                    if (comparison) {
                        const encryptednewPassword = await bcrypt.hash(
                            newPassword,
                            saltRounds
                        );
                        //        console.log(currentPassword, results[0].Application_Password, encryptednewPassword);
                        con.query(
                            `UPDATE infomatics.app_register  SET Password='${encryptednewPassword}' WHERE Password = '${results[0].Password}'`
                        );
                        if (error) {
                            res.send({
                                code: 400,
                                failed: "error occurred while updating password!!!",
                                error: error,
                            });
                        } else {


                            res.send({
                                code: 200,
                                success: "Passowrd updated successfully!!!",
                            });

                            messageFunc.sendEmail(
                                { email: results[0].Email_Id, newPassword: newPassword },
                                "Infomate Team- Welcome to Infomate Server",
                                msgTemplete
                            );


                            //console.log(result);
                            //return result;
                        }
                    } else {
                        res.send({
                            code: 204,
                            error: "Current Password is inncorrect",
                        });
                    }
                } else {
                    res.send({
                        code: 206,
                        error: "Email-Id does not exist",
                    });
                }
            }
        }
    );
});

app.post("/applicationSuperAdmin", (req, res) => {

    var sql = "SELECT Id,Application_Name,Url,Phone_Number,Email_Id,Status,User_Id `System_User_Id` FROM infomatics.messaging_gateway_register where Application_Name='InfoGateway' and `status`=9";
    con.query(sql, function (err, result) {
        if (err) throw err;
        //console.log(result);

        res.send(JSON.parse(JSON.stringify(result)));
        res.end();
    });
});

app.post("/applicationUserAdmin", (req, res) => {
    //store id in  session 
    var sql = "SELECT Id,Application_Name,Url,Phone_Number,Email_Id,Status,User_Id `System_User_Id` FROM infomatics.messaging_gateway_register where Pub_Sub_Id='" + req.body.Id + "' and `status`=9";
    con.query(sql, function (err, result) {
        if (err) throw err;
        //console.log(result);

        res.send(JSON.parse(JSON.stringify(result)));
        res.end();
    });
});

app.post("/applicationList", (req, res) => {

    var sql = "SELECT Id,Application_Name,Url,Phone_Number,Email_Id,Status,User_Id `System_User_Id` FROM infomatics.messaging_gateway_register where Application_Name!='InfoGateway' and `status` not in (0,1)";
    con.query(sql, function (err, result) {
        if (err) throw err;
        //console.log(result);

        res.send(JSON.parse(JSON.stringify(result)));
        res.end();
    });
});
app.post("/applicationEdit", (req, res) => {
    //console.log(req.body);
    var sql = "UPDATE infomatics.messaging_gateway_register SET Application_Name='" + req.body.aname + "',Url='" + req.body.appUrl + "',Phone_Number='" + req.body.phoneNumber + "',Email_Id='" + req.body.email + "',User_Id='" + req.body.sysUserId + "' WHERE Id='" + req.body.id + "'/* and Application_Name='" + req.body.aname + "'*/";
    con.query(sql, function (err, result) {
        if (err) throw err;

        res.send("Success");
        res.end();
    });
});

app.post("/editAppStatus", async (req, res) => {
    var sql = "UPDATE infomatics.messaging_gateway_register SET Status='" + req.body.statusChange + "' WHERE Id='" + req.body.id + "' /*and Application_Name='" + req.body.name + "'*/";
    con.query(sql, function (err, result) {
        if (err) throw err;

        res.send("Success");
        res.end();
    });
});
app.post("/regenerateKey", (req, res) => {
    /*function makeid(length) {
      var result = '';
      var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
          charactersLength));
      }
      return result;
    }
    var Key = makeid(10);*/


    var sql = "set @oldKey:=0; set @oldKey:=(select  `Key`  from infomatics.app_register WHERE Id='" + req.body.id + "');SET @pubSubId :=0;set @pubSubId:=concat('App_', LPAD(FLOOR(RAND() * 999999.99), 4, '0')) ;UPDATE infomatics.app_register SET `Key`=@pubSubId WHERE Id='" + req.body.id + "';UPDATE infomatics.messaging_gateway_register SET Pub_Sub_Id=@pubSubId where Pub_Sub_Id=@oldKey;SELECT * FROM infomatics.app_register WHERE Id='" + req.body.id + "';";
    con.query(sql, function (err, result) {
        if (err) throw err;
        Console.log(result);
        res.send("Success");
        con.query(
            "SELECT * FROM infomatics.app_register WHERE Id='" + req.body.id + "' ",
            async function (error, results, fields) {
                if (error) {
                    res.send({
                        code: 400,
                        failed: "error occurred",
                        error: error,
                    });
                } else {
                    if (results.length > 0) {
                        console.log(results);
                        var msgTemplete = messageTemplete.regenerateKey({
                            Key: results[0].Key
                        });
                        messageFunc.regeneratedKey(
                            { email: results[0].Email_Id, Key: results[0].Key },
                            "Infomate Team- Welcome to Infomate Server",
                            msgTemplete
                        );
                        res.end();
                    }
                }

                res.end();

            });
    });

});

app.post("/applicationDelete", (req, res) => {

    var sql = "Delete from infomatics.messaging_gateway_register WHERE Id='" + req.body.id + "' /*and Application_Name='" + req.body.aname + "'*/";
    con.query(sql, function (err, result) {
        if (err) throw err;
        //console.log(result);

        res.send("Success");
        res.end();
    });
});

app.post("/usersList", (req, res) => {

    var sql = "SELECT * FROM infomatics.messaging_gateway_register where Application_Name!='InfoGateway' and (`Status` ='0' or `Status` ='1')";
    con.query(sql, function (err, result) {
        if (err) throw err;
        //console.log(result);
        res.send(JSON.parse(JSON.stringify(result)));
        res.end();
    });
});

app.post("/usersListAdmin", (req, res) => {

    var sql = "SELECT * FROM infomatics.messaging_gateway_register where Pub_Sub_Id='" + req.body.Id + "' and `status` in (0,1)";
    con.query(sql, function (err, result) {
        if (err) throw err;
        //console.log(result);
        res.send(JSON.parse(JSON.stringify(result)));
        res.end();
    });
});

app.post("/userDelete", (req, res) => {

    var sql = "Delete from infomatics.messaging_gateway_register WHERE Pub_Sub_Id='" + req.body.pubSubId + "'";
    con.query(sql, function (err, result) {
        if (err) throw err;
        //console.log(result);

        res.send("Success");
        res.end();
    });
});
app.post("/userEdit", (req, res) => {
    //console.log(req.params);
    // var sql = "IF not EXISTS(SELECT * FROM infomatics.messaging_gateway_register WHERE Email_Id='" + req.body.email + "' or Phone_Number='" + req.body.phone + "') then begin UPDATE infomatics.messaging_gateway_register SET Email_Id='" + req.body.email + "',Phone_Number='" + req.body.phone + "',Url='" + req.body.url + "' WHERE Pub_Sub_Id='" + req.body.pid + "' select 'Success' `Status`; end ; else begin  select 'Email-Id/Phone Number Already Exsits' `Status`; end;";
    const email = req.body.email;
    const pubsub = req.body.pid;
    const url = req.body.url;
    const pNo = req.body.phone;
    var sql = `call usp_editUser ('${email}','${pNo}','${url}','${pubsub}')`;
    //console.log(sql);
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log(result[0][0].Status);
        if (result[0][0].Status == 'Success') {
            res.send("Success");
        }
        else if (result[0][0].Status == 'Email-Id/Phone Number Already Exsits') {
            res.send("Email-Id/Phone Number Already Exsits");
        }

        res.end();
    });
});



app.use((req, res) => {
    res.status(404).send({ message: "404" });
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');



app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
//app.use('/',express.static(path.join(__dirname, 'public')));

// app.use(session({
//   secret: '123456cat',
//   resave: false,
//   saveUninitialized: true,
//   cookie: { maxAge: 60000 }
// }))

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} ...`);
});
