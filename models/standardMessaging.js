const config = require('../config');
const email = require('../templates/emailTemplates');
const con = require("./db");

require('../mailin.js/mailin');
const { MAIL_URL, MAIL_KEY, FROM_MAIL, FROM_NAME } = require("../config");


var sendEmail = (userDetails, subject, emailTemplates) => {
    //console.log(userDetails, subject, emailTemplates);
    try {
        let user = {};
        let email = userDetails.email;
        user[email] = userDetails.newPassword;
        //console.log(MAIL_URL, MAIL_KEY, FROM_MAIL, FROM_NAME);
        let client = new Mailin(MAIL_URL, MAIL_KEY);
        //console.log(client);
        data = {
            "to": user,
            "from": [FROM_MAIL, FROM_NAME],
            "subject": subject,
            "html": emailTemplates

        }
        //console.log(client, data);
        client.send_email(data).on('complete', function (data) {
            console.log(data);
            return data;
        });
    } catch (err) {
        return err;
    }
}


var regeneratedKey = (userDetails, subject, emailTemplates) => {

    try {
        let user = {};
        let email = userDetails.email;
        user[email] = userDetails.Key;
        //console.log(MAIL_URL, MAIL_KEY, FROM_MAIL, FROM_NAME);
        let client = new Mailin(MAIL_URL, MAIL_KEY);
        console.log(client);
        data = {
            "to": user,
            "from": [FROM_MAIL, FROM_NAME],
            "subject": subject,
            "html": emailTemplates

        }
        console.log(client, data);
        client.send_email(data).on('complete', function (data) {
            console.log(data);
            return data;
        });
    } catch (err) {
        return err;
    }
}

var pushMessageToEmail = (userDetails, subject, emailTemplates) => {

    try {
        let user = {};
        let email = userDetails.email;

        console.log("dfsgegrtgrtgfghfghdfghfgh->" + userDetails.To_User_Id);
        user[email] = userDetails.email;
        //console.log(MAIL_URL, MAIL_KEY, FROM_MAIL, FROM_NAME);
        let client = new Mailin(MAIL_URL, MAIL_KEY);
        //console.log(client);
        data = {
            "to": user,
            "from": [FROM_MAIL, FROM_NAME],
            "subject": subject,
            "html": emailTemplates

        }
        //console.log(client, data);
        client.send_email(data).on('complete', function (data) {
            var d = JSON.parse(data);
            console.log(d.code);
            if (d.code == "success") {
                var setMessageStatusToSuccess = "UPDATE infomatics.queue SET Message_Status='SUCCESS' WHERE Message_Status='Pending' and Sent_Mode=1 AND Message_Id='" + userDetails.Message_Id + "' and To_User_Ids='" + userDetails.To_User_Id + "'";
                con.query(setMessageStatusToSuccess, function (err, result) {
                    if (err) throw err;
                    console.log(setMessageStatusToSuccess);
                    //console.log("Success");
                    //res.send(result[0][0]);
                    //res.end();
                });
            }
            else {
                var setSendModeToPull = "UPDATE infomatics.queue SET Sent_Mode=0 WHERE Message_Status='Pending' and Sent_Mode=1 AND Message_Id='" + userDetails.Message_Id + "' and To_User_Ids='" + userDetails.To_User_Id + "'";
                con.query(setSendModeToPull, function (err, result) {
                    if (err) throw err;
                    console.log("Success");


                });
            }
            return data;
        });
    } catch (err) {
        return err;
    }
}


var sendPubSubId = (userDetails, subject, emailTemplates) => {
    //console.log(userDetails, subject);
    try {
        let user = {};
        let email = userDetails.email;
        user[email] = userDetails.pubSubKey;
        user[email] = userDetails.verifyOtp;
        //console.log(MAIL_URL, MAIL_KEY, FROM_MAIL, FROM_NAME);
        let client = new Mailin(MAIL_URL, MAIL_KEY);
        //console.log(client);
        data = {
            "to": user,
            "from": [FROM_MAIL, FROM_NAME],
            "subject": subject,
            "html": emailTemplates

        }
        //console.log(client, data);
        client.send_email(data).on('complete', function (data) {
            console.log(data);
            return data;
        });
    } catch (err) {
        return err;
    }
}


var updatePasswordMessage = (userDetails) => {

    let changePasswordTemplate = email.changePassword(userDetails.userName);
    try {
        let user = {};
        let email = userDetails.email;
        user[email] = "User";
        console.log(user);
        let client = new Mailin(MAIL_URL, MAIL_KEY);
        data = {
            "to": user,
            "from": [FROM_MAIL, FROM_NAME]
        }

        client.send_email(data).on('complete', function (data) {
            return data;
        });
    } catch (err) {
        return err;
    }
}



// var userMessage = (messageCode, userDetails) => {
//     try {
//         switch (messageCode) {
//             case 0: // User does not exist
//                 return { "code": "notfound", "message": "User Not Found!" };
//             case 1: //Welcome Message
//                 return `Hello ${userDetails.username}, Welcome to Exam Portal. Your otp is ${userDetails.otpValue}.`;
//             case 2: //Forgot Password
//                 return `Dear ${userDetails.username}, Your password has been reset. Your otp is ${userDetails.otpValue}.`;
//             case 3: //Check Username and Password
//                 return `Please check username and password`;
//             default: //Error Message        
//                 return `Oops! Something went wrong`;
//         }
//     } catch (err) {
//         return err;
//     }
// }

module.exports = {

    updatePasswordMessage,
    regeneratedKey,
    pushMessageToEmail,
    //userMessage,
    sendEmail, sendPubSubId
}