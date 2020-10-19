'use strict'

const { TRANSPORTER_SECOND_OPTIONS, client_server, blobAccessToken } = require('../config')
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

 var transporter = nodemailer.createTransport(TRANSPORTER_SECOND_OPTIONS);
 transporter.use('compile', hbs(options));


function sendMail_request_genetic_program_external_patient (email, lang, randomIdRequest, userName){
  //caso 1.1.2
  const decoded = new Promise((resolve, reject) => {

    var maillistbcc = [
      TRANSPORTER_SECOND_OPTIONS.auth.user
    ];

    var subjectlang='Together towards a diagnostic '+' [ID: '+randomIdRequest+']';

    if(lang=='es'){
      subjectlang='Juntos hacia el diagnóstico '+' [ID: '+randomIdRequest+']';
    }

    var attachments = [];
    if(lang=='es'){
      attachments.push({filename: 'diagnostico - informacion.pdf', path: './documents/Documento_informativo.pdf'});
    }else{
      attachments.push({filename: 'diangosis - overview.pdf', path: './documents/Informative_document.pdf'});
    }


    var mailOptions = {
      to: email,
      from: TRANSPORTER_SECOND_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: subjectlang,
      template: 'request_genetic_program_external_patient/_'+lang,
      context: {
        client_server : client_server,
        email: email,
        randomIdRequest: randomIdRequest,
        userName: userName
      },
      attachments:attachments
    };

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
