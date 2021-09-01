const Queue = require("../models/queue");
const MsgUpdate = require("../models/queue");
const con = require("../models/db");
const { json } = require("body-parser");
var express = require("express");
var bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const soap = require("soap");



const { MAIL_URL, MAIL_KEY, FROM_MAIL, FROM_NAME } = require("../config");
const messageTemplete = require("../templates/emailTemplates");
const messageFunc = require("../models/standardMessaging");






const queue_create_post = (req, res) => {
    const Message_Status = 'Pending';
    var sql = `CALL usp_Insert_Message('` + req.body.Event_Source_Application + `','` + req.body.Event_Name + `','` + req.body.Message_Id + `','` + req.body.Message_Text + `','` + req.body.To_User_Ids + `','` + Message_Status + `','` + req.body.Created_Date + `','` + req.body.Key + `')`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log(sql);
        console.log(result[0][0]);
        if (result.affectedRows == 0) {
            res.send("Key Does not Match!!!");
        } else {

            res.send(result[0][0]);//added Result here!!
            res.end();
        }

    });

}



function queue_check() {
    var sql =
        `SELECT  Event_Source_Application 'EventSourceApplication',Event_Name
   'EventName',Q.Message_Id 'MessageId', MQ.Message 'MessageText', Q.To_User_Ids 
   'ToUserIds',Message_Status 'MessageStatus' ,M.Pub_Sub_Id 'Pub_Sub_Id',Created_Date  'CreatedDate' FROM infomatics.queue Q
    INNER JOIN infomatics.message_q MQ ON MQ.Message_Id=Q.Message_Id INNER JOIN infomatics.messaging_gateway_register
     M ON M.User_Id=Q.To_User_Ids and M.Application_Name=Q.Event_Source_Application WHERE 
   Message_Status='Pending' and Sent_Mode=1 ORDER BY Q.Id DESC LIMIT 1;`;
    console.log(sql);

    con.query(sql, function (err, result) {
        if (err) throw err;
        else {
            console.log(result);
            if (result.length > 0) {
                const EventSourceApplication = result[0].EventSourceApplication
                const ToUserIds = result[0].ToUserIds;
                const EventName = result[0].EventName

                const MessageId = result[0].MessageId

                const MessageText = result[0].MessageText
                const MessageStatus = result[0].MessageStatus
                const createdDate = result[0].CreatedDate
                const Pub_Sub_Id = result[0].Pub_Sub_Id



                var sqlPushUrl = "SELECT Url FROM infomatics.messaging_gateway_register WHERE Application_Name='" + EventSourceApplication + "' and User_Id='" + ToUserIds + "' and `Status`=1  AND EXISTS (SELECT  * FROM infomatics.messaging_gateway_register WHERE Pub_Sub_Id='" + Pub_Sub_Id + "')";
                var sqlPushEmail = "SELECT Email_Id,User_Id FROM infomatics.messaging_gateway_register WHERE Application_Name='" + EventSourceApplication + "' and User_Id='" + ToUserIds + "' and `Status`=1 AND EXISTS (SELECT  * FROM infomatics.messaging_gateway_register WHERE Pub_Sub_Id='" + Pub_Sub_Id + "')";
                con.query(sqlPushUrl, function (err, result) {
                    if (err) throw err;
                    console.log(sqlPushUrl);
                    console.log(sqlPushEmail);
                    console.log(result[0].Url);
                    if (result.length > 0 && result[0].Url != '') {

                        //var url = 'https://demo.sowcare.net/webservice/CareplexInfomaticWebServices.asmx?WSDL';
                        //if (result[0].Url == url) {
                        var args = {
                            UserId: ToUserIds, EventSourceName: EventSourceApplication,
                            EventName: EventName, MessageId: MessageId, Message: MessageText,
                            MessageStatus: MessageStatus, EventSourceWebHook: '', Created_Date: createdDate, Key: Pub_Sub_Id
                        };
                        soap.createClient(result[0].Url, function (err, client) {
                            if (err) {
                                throw err;
                            }
                            client.InsertackToInfomaticInbox(args, function (err, result) {
                                console.log("result...", result);
                                //var d = JSON.parse(result);
                                //console.log("...", result.InsertackToInfomaticInboxResult);
                                if (result.InsertackToInfomaticInboxResult == "Success") {
                                    var setMessageStatusToSuccess = "UPDATE infomatics.queue SET Message_Status='SUCCESS' WHERE Message_Status='Pending' and Sent_Mode=1 AND Message_Id='" + MessageId + "' and To_User_Ids='" + ToUserIds + "'";
                                    con.query(setMessageStatusToSuccess, function (err, result) {
                                        if (err) throw err;
                                        console.log(setMessageStatusToSuccess);

                                        //res.send(result[0][0]);
                                        //res.end();
                                    });
                                }
                                else {
                                    con.query(sqlPushEmail, function (err, result) {
                                        if (err) throw err;
                                        //console.log(sqlPushEmail);
                                        console.log(result[0].Email_Id);


                                        if (result.length > 0 && result[0].Email_Id != '') {
                                            //const Message_Id = MessageId;
                                            //const Message = MessageText;
                                            //const Event_Source_Application = EventSourceApplication;
                                            var msgTemplete = messageTemplete.pushMessageToEmail({
                                                Email: result[0].Email_Id,
                                                Event_Source_Application: EventSourceApplication,
                                                Message_Id: MessageId,
                                                Message: MessageText,
                                                To_User_Id: result[0].User_Id
                                            });
                                            messageFunc.pushMessageToEmail(
                                                {
                                                    email: result[0].Email_Id,
                                                    Event_Source_Application: EventSourceApplication,
                                                    Message_Id: MessageId,
                                                    Message: MessageText,
                                                    To_User_Id: result[0].User_Id
                                                },
                                                "You have new Message!!!",
                                                msgTemplete
                                            );

                                        }
                                        else {
                                            var setSendModeToPull = "UPDATE infomatics.queue SET Sent_Mode=0 WHERE Message_Status='Pending' and Sent_Mode=1 AND Message_Id='" + MessageId + "' and To_User_Ids='" + ToUserIds + "'";
                                            con.query(setSendModeToPull, function (err, result) {
                                                if (err) throw err;
                                                console.log("Success");


                                            });
                                        }


                                    });
                                }

                            });
                        });

                        //}
                    }
                    else {

                        con.query(sqlPushEmail, function (err, result) {
                            if (err) throw err;
                            //console.log(sqlPushEmail);
                            console.log(result[0].Email_Id);


                            if (result.length > 0 && result[0].Email_Id != '') {
                                //const Message_Id = MessageId;
                                //const Message = MessageText;
                                //const Event_Source_Application = EventSourceApplication;
                                var msgTemplete = messageTemplete.pushMessageToEmail({
                                    Email: result[0].Email_Id,
                                    Event_Source_Application: EventSourceApplication,
                                    Message_Id: MessageId,
                                    Message: MessageText,
                                    To_User_Id: result[0].User_Id
                                });
                                messageFunc.pushMessageToEmail(
                                    {
                                        email: result[0].Email_Id,
                                        Event_Source_Application: EventSourceApplication,
                                        Message_Id: MessageId,
                                        Message: MessageText,
                                        To_User_Id: result[0].User_Id
                                    },
                                    "You have new Message!!!",
                                    msgTemplete
                                );

                            }
                            else {
                                var setSendModeToPull = "UPDATE infomatics.queue SET Sent_Mode=0 WHERE Message_Status='Pending' and Sent_Mode=1 AND Message_Id='" + MessageId + "' and To_User_Ids='" + ToUserIds + "'";
                                con.query(setSendModeToPull, function (err, result) {
                                    if (err) throw err;
                                    console.log("Success");


                                });
                            }
                            //As soon as u enter the new message into the queue by default it shd be set to pending status(check for pending instead of checking !=success)

                        });
                    }



                });
            }
        }

    });
}


setInterval(queue_check, 1500);

/*let flag=0;//Initailly 
let delay = 5000;//service that sends a request to the server every 5 seconds asking for data
let timerId = setTimeout(function request() {
  if (request) {
    flag=1;
    // increase the interval to the next run
    delay *= 2; //in case the server is overloaded, it should increase the interval to 10, 20, 40 seconds…
  }
  timerId = setTimeout(request, delay);
}, delay);
setTimeout(queue_check);*/


// const queue_create_post = (req, res) => {

//   //method push /pull???

//   var sqlPushUrl = "SELECT Url,Pub_Sub_Id FROM infomatics.messaging_gateway_register WHERE Application_Name='" + req.body.Event_Source_Application + "' and User_Id='" + req.body.To_User_Ids + "' and `Status`=1 AND EXISTS (SELECT  * FROM infomatics.messaging_gateway_register WHERE Pub_Sub_Id='" + req.body.Key + "')";
//   var sqlPushEmail = "SELECT Email_Id FROM infomatics.messaging_gateway_register WHERE Application_Name='" + req.body.Event_Source_Application + "' and User_Id='" + req.body.To_User_Ids + "' and `Status`=1 AND EXISTS (SELECT  * FROM infomatics.messaging_gateway_register WHERE Pub_Sub_Id='" + req.body.Key + "'";

//   con.query(sqlPushUrl, function (err, result) {
//     if (err) throw err;
//     //console.log(sqlPushEmail);
//     console.log(result[0].Url);


//     if (result.affectedRows != 0 && result[0].Url != "") {

//       var url = 'https://demo.sowcare.net/webservice/CareplexInfomaticWebServices.asmx?WSDL';
//       if (result[0].Url == url) {
//         var args = { UserId: req.body.To_User_Ids, EventSourceName: req.body.Event_Source_Application, EventName: req.body.Event_Name, MessageId: req.body.Message_Id, message: req.body.Message_Text, MessageStatus: req.body.Message_Status, EventSourceWebHook: '', createdDate: req.body.Created_Date, Key: result[0].Pub_Sub_Id };
//         soap.createClient(url, function (err, client) {
//           if (err) {
//             throw err;
//           }
//           client.InsertackToInfomaticInbox(args, function (err, result) {
//             console.log("result...", result);

//           });
//         });

//       }
//     }
//     else {
//       con.query(sqlPushEmail, function (err, result) {
//         if (err) throw err;
//         //console.log(sqlPushEmail);
//         console.log(result[0].Email_Id);


//         if (result.affectedRows != 0 && result[0].Email_Id != "") {

//           var msgTemplete = messageTemplete.pushMessageToEmail({
//             Email: result[0].Email_Id,
//             Event_Source_Application: req.body.Event_Source_Application,
//             Message_Id: req.body.Message_Id,
//             Message: req.body.Message_Text
//           });
//           messageFunc.pushMessageToEmail(
//             {
//               email: result[0].Email_Id,
//               Event_Source_Application: req.body.Event_Source_Application,
//               Message_Id: req.body.Message_Id,
//               Message: req.body.Message
//             },
//             "You have new Message!!!",
//             msgTemplete
//           );
//           res.send(result[0][0]);
//           res.end();
//         }
//         else {
//           var sql = `CALL usp_Insert_Message('` + req.body.Event_Source_Application + `','` + req.body.Event_Name + `','` + req.body.Message_Id + `','` + req.body.Message_Text + `','` + req.body.To_User_Ids + `','` + req.body.Message_Status + `','` + req.body.Created_Date + `','` + req.body.Key + `')`;
//           con.query(sql, function (err, result) {
//             if (err) throw err;
//             console.log(sql);
//             console.log(result[0][0]);
//             if (result.affectedRows == 0) {
//               res.send("Key Does not Match!!!");
//             } else {

//               res.send(result[0][0].Result);//added Result here!!
//               res.end();
//             }

//           });

//         }
//       });
//     }
//   });
// }


const message_details = (req, res) => {
    const Event_Source_Application = req.params.eventSourceApplication;
    const Subscriber_Id = req.params.subscriberId;
    var sql =
        "select  User_Id from infomatics.messaging_gateway_register where Pub_Sub_Id='" +
        Subscriber_Id + "' and Application_Name='" + Event_Source_Application + "' and Status=1";//ADDED STATUS
    var sql2 =
        "SELECT  Event_Source_Application 'EventSourceApplication',Event_Name 'EventName',Q.Message_Id 'MessageId', MQ.Message 'MessageText', Q.To_User_Ids 'SubscriberId',Message_Status 'MessageStatus'  FROM infomatics.queue Q INNER JOIN infomatics.message_q MQ ON MQ.Message_Id=Q.Message_Id WHERE Event_Source_Application='" +
        Event_Source_Application +
        "' AND Q.To_User_Ids=(" +
        sql +
        ") AND Message_Status='Pending' and Sent_Mode=0 ORDER BY Q.Id DESC LIMIT 1;";
    console.log(sql2);
    con.query(sql2, function (err, result) {
        if (err) throw err;


        let x = JSON.stringify(result[0])
        console.log(x);
        if (x == undefined) {
            x = "";
        }
        res.send(`[` + x + `]`);
        res.end();
    });
};

const queue_create_put = (req, res) => {
    const Subscriber_Id = req.params.subscriberId;
    var str = req.body;
    console.log(str);
    const { UserId, EventId, EventName, EventStatus } = str.ack;
    //console.log(EventId, EventName, EventStatus);
    var sql =
        "select User_Id from infomatics.messaging_gateway_register where Pub_Sub_Id='" +
        Subscriber_Id + "'";
    var sql2 =
        "UPDATE infomatics.queue SET Message_Status='SUCCESS' , Event_Source_Web_Hook='" +
        EventStatus +
        "' , Modified_Date=CURRENT_TIMESTAMP WHERE Event_Name='" +
        EventName +
        "' and Message_Id='" +
        EventId +
        "' AND To_User_Ids=(" +
        sql +
        ") AND Message_Status='Pending'and Sent_Mode=0 ;";
    console.log(sql2);
    con.query(sql2, function (err, result) {
        if (err) throw err;
        if (result.affectedRows > 0) {
            res.send({ "Result": "Success" });
            res.end();
        }
        else {
            res.send({ "Result": "Failure" });
            res.end();
        }

    });
};

const queue_ack = (req, res) => {

    var sql = `CALL usp_ack('` + req.body.Val + `')`;
    console.log(req.body.val)
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result));
        res.send(result);
        res.end();
    });
};

const queue_log = (req, res) => {

    var sql = `CALL usp_message_log('` + req.body.Val + `')`;

    con.query(sql, function (err, result) {
        if (err) throw err;

        console.log("Number of records inserted: " + result.affectedRows);
        //res.send("Number of records inserted: " + result.affectedRows);
        res.end();
    });
};



const queue_AddelUser = async (req, res) => {
    var str = req.body;

    var { UserName, Password, Application, Action, Emailid, PNo, Url } = str.credentials;//Added Entity_Name
    Application = Application.toUpperCase();
    if (Application == 'CAREPLEX' && Action == 'Registration') {
        var url = 'https://demo.sowcare.net/webservice/CareplexInfomaticWebServices.asmx?WSDL';
        var args = { UserName: UserName, Password: Password, purpose: Action };
        soap.createClient(url, function (err, client) {
            if (err) {
                throw err;
            }
            client.User_Auth(args, function (err, result) {
                console.log("result...", result.User_AuthResult);
                demo(result.User_AuthResult, UserName, Password, Application, Action, res, Emailid, PNo, Url)
            });
        });
    }
    else if (Application == 'CAREPLEX' && Action == 'DeRegistration') {

        demo('', UserName, Password, Application, Action, res, '', '', '')


    }
    else {
        res.send({
            "Pub_Sub_Id": "",
            "Name": "",
            "Application_Name": Application,
            "Status": "Invalid Credentials!!!!",
            "Action": Action,
            "Email_Id": "",
            "Phone_Number": "",
            "Url": "",
            //"Affiliation_Ids": "",
            "Affiliation_Names": ""
        })
    }

};

function demo(User_AuthResult1, UserName, Password, Application, Action, res, Emailid, PNo, Url) {

    if (Application == 'CAREPLEX' && Action == 'Registration') {
        let User_AuthResult = JSON.parse(User_AuthResult1);
        console.log(User_AuthResult);
        var sql = `CALL infomatics.usp_Registration_DeRegistration('` + UserName + `','` + Password + `','` +
            Application + `','` + Action + `','` + User_AuthResult.userId + `','`
            + User_AuthResult.Name + `','` + User_AuthResult.status + `','`
            + Emailid + `','` + PNo + `','` + Url + `','` + User_AuthResult.Affiliation_Ids + `','` + User_AuthResult.Affiliation_Names + `')`;
    }
    else if (Application == 'CAREPLEX' && Action == 'DeRegistration') {

        var sql = `CALL infomatics.usp_Registration_DeRegistration('` + UserName + `','` + Password + `','` +
            Application + `','` + Action + `','` + '0' + `','`
            + '' + `','` + 'Success' + `','`
            + '' + `','` + '' + `','` + '' + `'` + '' + `,'` + '' + `','` + '' + `')`;
    }
    console.log(sql);
    con.query(sql, function (err, result) {

        if (err) throw err;
        console.log(result);
        //if (result[0][0].Status == 'Subscription Successsfull') {
        res.send({
            "Pub_Sub_Id": result[0][0].Pub_Sub_Id,
            "Name": result[0][0].Name,
            "Application_Name": result[0][0].Application_Name,
            "Status": result[0][0].Status,
            "Action": Action,
            "Email_Id": result[0][0].Email_Id,
            "Phone_Number": result[0][0].Phone_Number,
            "Url": result[0][0].Url,
            //"Affiliation_Ids": result[0][0].Affiliation_Ids,
            "Affiliation_Names": result[0][0].Affiliation_Names

        });

        res.end();
    });
}




const register_App = (req, res) => {

    var sql1 =
        "INSERT INTO infomatics.app_register (Application_Name,Application_Url,Password,As_Publisher,As_Subscriber,Email_Id) values ('" +
        req.body.Application_Name +
        "','" +
        req.body.Application_Url +
        "','" +
        req.body.Password +
        "','" +
        req.body.As_Publisher +
        "','" +
        req.body.As_Subscriber +
        "','" +
        con.query(sql, function (err, result) {
            if (err) throw err;
            {
                console.log("Number of records inserted: " + result.affectedRows);
                res.send("Number of records inserted: " + result.affectedRows);
                res.end();
            }
        });
};


const queue_inbox = (req, res) => {

    var sql = `CALL usp_inbox('` + req.body.Val + `')`;
    console.log(req.body.val)
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result[0]));
        res.send(JSON.stringify(result[0]));
        res.end();
    });
};
const verifyOtpEmail = (req, res) => {
    //console.log(req.body);
    const EmailId = req.params.email;
    const Otp = req.params.otp;
    var sql = "SET @stat:=(SELECT `Status` FROM infomatics.messaging_gateway_register WHERE Email_Id='" + EmailId + "') ; UPDATE infomatics.messaging_gateway_register SET `Status`=@stat+4  WHERE Email_Id='" + EmailId + "'";
    con.query(sql, function (err, result) {
        if (err) throw err;
        res.send("Success");
        res.end();
    });
};

const verifyOtpPhone = (req, res) => {
    //console.log(req.body);
    const PhoneNumber = req.params.pNo;
    const Otp = req.params.otp;
    var sql = "SET @stat:=(SELECT `Status` FROM infomatics.messaging_gateway_register WHERE Email_Id='" + EmailId + "') ;UPDATE infomatics.messaging_gateway_register SET `Status`='3'  WHERE `Status`=@stat+3 AND Phone_Number='" + PhoneNumber + "'";
    con.query(sql, function (err, result) {
        if (err) throw err;
        res.send("Success");
        res.end();
    });


};

const SendSms = (req, res) => {
    //console.log(req.body);
    const Message = req.body.message;
    const PhoneNumber = req.body.phoneNumber;

    const username = "rampskumar";
    const password = "vlfRDt44";
    const from = "SOWNET"; // Message Header
    const ctId = "1207162684337760653"; // DLT Content Tempate Id
    const peId = "1201159411873790283"; // Jio DLT PE ID (Principal Entity ID)

    if (PhoneNumber == 10) {
        PhoneNumber = "91" + PhoneNumber
    }
    baseurl = string.Format("https://api.kapsystem.com/sms/1/text/query?username={0}&password={1}&from={2}&to={3}&text={4}&indiaDltContentTemplateId={5}&indiaDltPrincipalEntityId={6}", username, password, from, PhoneNumber, Message, ctId, peId);


};


module.exports = {
    queue_create_post,
    message_details,
    queue_create_put,
    queue_AddelUser,
    queue_ack,
    queue_log,
    register_App,
    queue_inbox,
    verifyOtpEmail,
    verifyOtpPhone
};
