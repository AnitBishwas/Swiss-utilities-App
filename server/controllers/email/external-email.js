import AWS from "aws-sdk";
import e from "express";

const sesConfig = {
  accessKeyId: process.env.aws_access_key_id,
  secretAccessKey: process.env.aws_secret_access_key,
  region: process.env.aws_ses_region,
};

const AWS_SES = new AWS.SES(sesConfig);

const sendEmail = async (emailList, content) => {
  try {
    if (emailList.length == 0 || !content) {
      throw new Error("Required params missing");
    }
    let params = {
      Source: "support@swissbeauty.in",
      Destination: {
        ToAddresses: emailList,
      },
      ReplyToAddresses: [],
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: content,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: `Website contact form`,
        },
      },
    };
    return AWS_SES.sendEmail(params).promise();
  } catch (err) {
    throw new Error("Failed to send email reason -->" + err.message);
  }
};

export { sendEmail };
