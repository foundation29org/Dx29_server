'use strict'

const { TRANSPORTER_OPTIONS, client_server, blobAccessToken } = require('../config')
const nodemailer = require('nodemailer')
var hbs = require('nodemailer-express-handlebars')

var options = {
     viewEngine: {
         extname: '.hbs',
         layoutsDir: 'views/email/',
         defaultLayout : 'template_gtp_en'
     },
     viewPath: 'views/email/',
     extName: '.hbs'
 };

 var transporter = nodemailer.createTransport(TRANSPORTER_OPTIONS);
 transporter.use('compile', hbs(options));


function sendMail_request_genetic_program_external_patient (email, lang, state, randomIdRequest, userName){
  //caso 1.1.2
  const decoded = new Promise((resolve, reject) => {

    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var subjectlang='Together towards a diagnostic '+' [ID: '+randomIdRequest+']';

    if(lang=='es'){
      subjectlang='Juntos hacia el diagnóstico '+' [ID: '+randomIdRequest+']';
    }


    var mailOptions = {
      to: email,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: subjectlang,
      template: 'request_genetic_program_external_patient/accepted/_'+lang,
      context: {
        client_server : client_server,
        email: email,
        randomIdRequest: randomIdRequest,
        userName: userName
      }
    };

    if(state=='Rejected'){
      mailOptions = {
        to: email,
        from: TRANSPORTER_OPTIONS.auth.user,
        bcc: maillistbcc,
        subject: subjectlang,
        template: 'request_genetic_program_external_patient/rejected/_'+lang,
        context: {
          client_server : client_server,
          email: email,
          randomIdRequest: randomIdRequest
        }
      };
    }

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        console.log('Email sent: ' + info.response);
        resolve("ok")
      }
    });

  });
  return decoded
}


module.exports = {
  sendMail_request_genetic_program_external_patient
}
