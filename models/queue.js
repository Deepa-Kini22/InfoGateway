const sql = require("../models/db");

const Queue = function (queue) {
    this.Event_Source_Application = queue.Event_Source_Application;
    this.Event_Source_Web_Hook = queue.Event_Source_Web_Hook;
    this.Event_Name = queue.Event_Name;
    this.Message_Id = queue.Message_Id;
    this.Message_Text = queue.Message_Text;
    this.Subscriber_Id = queue.Subscriber_Id;
    this.Message_Status = queue.Message_Status;
    this.Created_Date = queue.Created_Date;
    this.Modified_Date = queue.Modified_Date;
};

const MsgUpdate = function (msgUpdate) {

    this.UserId = msgUpdate.UserId;
    this.EventId = msgUpdate.EventId;
    this.EventName = msgUpdate.EventName;
    this.EventStatus = msgUpdate.EventStatus;
};

module.exports = {
    Queue, MsgUpdate
}