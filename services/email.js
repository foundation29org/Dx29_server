'use strict'

const { TRANSPORTER_OPTIONS, client_server, blobAccessToken } = require('../config')
const nodemailer = require('nodemailer')
var hbs = require('nodemailer-express-handlebars')

var options = {
     viewEngine: {
         extname: '.hbs',
         layoutsDir: 'views/email/',
         defaultLayout : 'template'
     },
     viewPath: 'views/email/',
     extName: '.hbs'
 };

 var transporter = nodemailer.createTransport(TRANSPORTER_OPTIONS);
 transporter.use('compile', hbs(options));

function sendMailVerifyEmail (email, randomstring, lang, group){
  if(lang=='es'){
    var subjectlang='Dx29 - Activa la cuenta';
  }else if(lang=='pt'){
    var subjectlang='Dx29 - Ative a conta';
  }else if(lang=='de'){
    var subjectlang='Dx29 - Aktivieren Sie das Konto';
  }else if(lang=='nl'){
    var subjectlang='Dx29 - Activeer het account';
  }else{
    var subjectlang='Dx29 - Activate the account';
  }
  const decoded = new Promise((resolve, reject) => {
    var urlImg = 'https://www.dx29.ai/assets/img/logo-Dx29.png';
    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var mailOptions = {
      to: email,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: subjectlang,
      template: 'verify_email/_'+lang,
      context: {
        client_server : client_server,
        email : email,
        key : randomstring,
        urlImg: urlImg
      }
    };


    if(group == 'Duchenne Parent Project Netherlands'){
      urlImg = 'https://www.dx29.ai/assets/img/duchenne-medium.png';

      var maillistbcc = [
        'info@duchenne.nl',
        'fknuistinghneven@gmail.com'
      ];

      mailOptions = {
        to: email,
        from: TRANSPORTER_OPTIONS.auth.user,
        bcc: maillistbcc,
        subject: subjectlang,
        template: 'verify_email/_'+lang,
        context: {
          client_server : client_server,
          email : email,
          key : randomstring,
          urlImg: urlImg
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
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMailRecoverPass (email, randomstring, lang){
  if(lang=='es'){
    var subjectlang='Dx29 - Recuperación de la cuenta';
  }else if(lang=='pt'){
    var subjectlang='Dx29 - Recuperação de conta';
  }else if(lang=='de'){
    var subjectlang='Dx29 - Kontowiederherstellung';
  }else if(lang=='nl'){
    var subjectlang='Dx29 - Accountherstel';
  }else{
    var subjectlang='Dx29 - Account Recovery';
  }
  const decoded = new Promise((resolve, reject) => {
    var urlImg = 'https://www.dx29.ai/assets/img/logo-Dx29.png';

    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user,
    ];

    var mailOptions = {
      to: email,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: subjectlang,
      template: 'recover_pass/_'+lang,
      context: {
        client_server : client_server,
        email : email,
        key : randomstring,
        urlImg: urlImg
      }
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}


function sendMailRequestNewLanguage (user, name, code){

  var maillistbcc = [
    TRANSPORTER_OPTIONS.auth.user
  ];

  const decoded = new Promise((resolve, reject) => {
    var mailOptions = {
      to: TRANSPORTER_OPTIONS.auth.user,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: 'Request for new language',
      template: 'request_new_lang/_en',
      context: {
        user : user,
        name : name,
        code : code
      }
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMailRequestNewTranslation (user, lang, jsonData){

  var maillistbcc = [
    TRANSPORTER_OPTIONS.auth.user
  ];

  const decoded = new Promise((resolve, reject) => {
    var mailOptions = {
      to: TRANSPORTER_OPTIONS.auth.user,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: 'Request for new translation',
      template: 'request_new_translation/_en',
      context: {
        user : user,
        lang : lang,
        jsonData : jsonData
      },
      attachments: [
      {   // utf-8 string as an attachment
          filename: lang+'.json',
          content: jsonData
      }]
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMailSupport (email, lang, role, supportStored){
  const decoded = new Promise((resolve, reject) => {
    var urlImg = 'https://www.dx29.ai/assets/img/logo-Dx29.png';
    var attachments = [];
    if(supportStored.files.length>0){
      supportStored.files.forEach(function(file) {
        var urlpath = blobAccessToken.blobAccountUrl+'filessupport/'+file+blobAccessToken.sasToken;
        attachments.push({filename: file, path: urlpath});
      });
    }
    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var mailOptions = {
      to: TRANSPORTER_OPTIONS.auth.user,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: 'Mensaje para soporte de DX29',
      template: 'mail_support/_es',
      context: {
        email : email,
        lang : lang,
        info: supportStored
      },
      attachments: attachments
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMailErrorFromServer (patient, msg, service){

  const decoded = new Promise((resolve, reject) => {
    var mailOptions = {
      to: TRANSPORTER_OPTIONS.auth.user,
      from: TRANSPORTER_OPTIONS.auth.user,
      subject: 'Error from server',
      template: 'error_from_server/_en',
      context: {
        client_server : client_server,
        patient : patient,
        msg : msg,
        service : service
      }
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMailMonarchIsActive (emails){
  const decoded = new Promise((resolve, reject) => {

    var mailOptions = {
      to: TRANSPORTER_OPTIONS.auth.user,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: emails,
      subject: 'DX29: Monarch service active',
      template: 'monarch_is_up/_en'
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMailMonarchIsInactive (){
  const decoded = new Promise((resolve, reject) => {

    var mailOptions = {
      to: TRANSPORTER_OPTIONS.auth.user,
      from: TRANSPORTER_OPTIONS.auth.user,
      subject: 'DX29: Monarch service inactive',
      template: 'monarch_is_down/_en',
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMailInvite (email, lang, patientName){
  const decoded = new Promise((resolve, reject) => {
    var urlImg = 'https://www.dx29.ai/assets/img/logo-Dx29.png';

    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var subjectlang='Dx29 - You have been invited to used Dx29';

    if(lang=='es'){
      subjectlang='Dx29 - Has sido invitado a usar Dx29';
    }else if(lang=='nl'){
      subjectlang='Dx29 - U bent uitgenodigd om Dx29 te gebruiken';
    }

    var mailOptions = {
      to: email,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: subjectlang,
      template: 'invite/_'+lang,
      context: {
        client_server : client_server,
        patientName: patientName
      }
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function sendMailShare (email, patientName, lang, internalmessage, clinicalName, message, userNameOrigin, emailOrigin, isMine, role){
  const decoded = new Promise((resolve, reject) => {
    var urlImg = 'https://www.dx29.ai/assets/img/logo-Dx29.png';

    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    patientName= capitalizeFirstLetter(patientName);
    userNameOrigin= capitalizeFirstLetter(userNameOrigin);

    var subjectlang=patientName+' needs help with their diagnosis';

    if(lang=='es'){
      subjectlang=patientName+ ' necesita ayuda con su diagnóstico';
    }

    var mailOptions = {};
    var temp =  message.replace(/ /g,'')
    if(role=='User'){
      if(temp.length==0){
        mailOptions = {
          to: email,
          from: TRANSPORTER_OPTIONS.auth.user,
          bcc: maillistbcc,
          subject: subjectlang,
          template: 'share/_'+lang,
          context: {
            client_server : client_server,
            patientName: patientName,
            urlImg: urlImg,
            userNameOrigin: userNameOrigin,
            emailOrigin: emailOrigin
          }
        };
      }else{
        mailOptions = {
          to: email,
          from: TRANSPORTER_OPTIONS.auth.user,
          bcc: maillistbcc,
          subject: subjectlang,
          template: 'sharewithmsg/_'+lang,
          context: {
            client_server : client_server,
            patientName: patientName,
            urlImg: urlImg,
            message: message,
            userNameOrigin: userNameOrigin,
            emailOrigin: emailOrigin
          }
        };
      }
    }else{
      if(lang=='es'){
        subjectlang=userNameOrigin+ ' quiere tu opinión sobre '+ patientName;
      }else{
        subjectlang=userNameOrigin+ ' wants your opinion on '+ patientName;
      }
      if(temp.length==0){
        mailOptions = {
          to: email,
          from: TRANSPORTER_OPTIONS.auth.user,
          bcc: maillistbcc,
          subject: subjectlang,
          template: 'clinicianshare/_'+lang,
          context: {
            client_server : client_server,
            patientName: patientName,
            urlImg: urlImg,
            userNameOrigin: userNameOrigin,
            emailOrigin: emailOrigin
          }
        };
      }else{
        mailOptions = {
          to: email,
          from: TRANSPORTER_OPTIONS.auth.user,
          bcc: maillistbcc,
          subject: subjectlang,
          template: 'cliniciansharewithmsg/_'+lang,
          context: {
            client_server : client_server,
            patientName: patientName,
            urlImg: urlImg,
            message: message,
            userNameOrigin: userNameOrigin,
            emailOrigin: emailOrigin
          }
        };
      }
    }



    if(internalmessage=='Request genetic test'){
      //Solicitud de test genetico por parte del paciente a un clínico que ya existe (caso 2)
      if(lang=='es'){
        subjectlang='Dx29 - Un paciente le invita a trabajar en su caso en Dx29';
      }else if(lang=='nl'){
        subjectlang='Dx29 - Een patiënt nodigt u uit om hun zaak te werken aan Dx29';
      }
      mailOptions = {
        to: email,
        from: TRANSPORTER_OPTIONS.auth.user,
        bcc: maillistbcc,
        subject: subjectlang,
        template: 'request_genetic_share/_'+lang,
        context: {
          client_server : client_server,
          patientName: patientName,
          urlImg: urlImg,
          clinicalName: clinicalName,
          email: email
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
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMailNewClinicialShare (email, patientName, lang, internalmessage, message, emailOrigin, mydata){
  const decoded = new Promise((resolve, reject) => {
    var urlImg = 'https://www.dx29.ai/assets/img/logo-Dx29.png';

    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var subjectlang='Dx29 - A patient is inviting you to discover Dx29';
    patientName= capitalizeFirstLetter(patientName);
    if(lang=='es'){
      subjectlang=patientName+ ' necesita ayuda con su diagnóstico';
    }else{
      subjectlang=patientName+ ' needs help with their diagnosis';
    }

    var mailOptions = {};
    var temp =  message.replace(/ /g,'')
    if(mydata.myRole=='Clinical'){
      if(internalmessage=='Request genetic test'){
        //Solicitud de test genetico por parte del paciente a un clínico que no existe (caso 1)
        mailOptions = {
          to: email,
          from: TRANSPORTER_OPTIONS.auth.user,
          bcc: maillistbcc,
          subject: subjectlang,
          template: 'new_clinical_share_genetic/_'+lang,
          context: {
            client_server : client_server,
            patientName: patientName,
            email: email,
            urlImg: urlImg
          }
        };
      }else{
        if(lang=='es'){
          subjectlang=mydata.myUserName+ ' quiere tu opinión sobre '+patientName;
        }else{
          subjectlang=mydata.myUserName+ '  wants your opinion on '+patientName;
        }

        if(temp.length==0){
          mailOptions = {
            to: email,
            from: TRANSPORTER_OPTIONS.auth.user,
            bcc: maillistbcc,
            subject: subjectlang,
            template: 'clinical_to_new_clinical_share/_'+lang,
            context: {
              client_server : client_server,
              patientName: patientName,
              email: email,
              message: message,
              emailOrigin: emailOrigin,
              myEmail:mydata.myEmail,
              myUserName:mydata.myUserName
            }
          };
        }else{
          mailOptions = {
            to: email,
            from: TRANSPORTER_OPTIONS.auth.user,
            bcc: maillistbcc,
            subject: subjectlang,
            template: 'clinical_to_new_clinical_share_withmsg/_'+lang,
            context: {
              client_server : client_server,
              patientName: patientName,
              email: email,
              message: message,
              emailOrigin: emailOrigin,
              myEmail:mydata.myEmail,
              myUserName:mydata.myUserName
            }
          };
        }
      }
    }else{
      if(internalmessage=='Request genetic test'){
        //Solicitud de test genetico por parte del paciente a un clínico que no existe (caso 1)
        mailOptions = {
          to: email,
          from: TRANSPORTER_OPTIONS.auth.user,
          bcc: maillistbcc,
          subject: subjectlang,
          template: 'new_clinical_share_genetic/_'+lang,
          context: {
            client_server : client_server,
            patientName: patientName,
            email: email,
            urlImg: urlImg
          }
        };
      }else{
        if(temp.length==0){
          mailOptions = {
            to: email,
            from: TRANSPORTER_OPTIONS.auth.user,
            bcc: maillistbcc,
            subject: subjectlang,
            template: 'new_clinical_share/_'+lang,
            context: {
              client_server : client_server,
              patientName: patientName,
              email: email,
              message: message,
              emailOrigin: emailOrigin
            }
          };
        }else{
          mailOptions = {
            to: email,
            from: TRANSPORTER_OPTIONS.auth.user,
            bcc: maillistbcc,
            subject: subjectlang,
            template: 'new_clinical_share_withmsg/_'+lang,
            context: {
              client_server : client_server,
              patientName: patientName,
              email: email,
              message: message,
              emailOrigin: emailOrigin
            }
          };
        }
      }
    }


    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMailRequestChangePermissionsUser (email, userName, lang, patientEmail, patientName, permissions, message, ownerUserName, owneremail, patientId){
  const decoded = new Promise((resolve, reject) => {

    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var subjectlang= ownerUserName+ ' wants to share your case';

    if(lang=='es'){
      subjectlang=ownerUserName+ ' quiere compartir tu caso';
    }

    var mailOptions = {};
    var temp =  message.replace(/ /g,'')
    if(temp.length==0){
      mailOptions = {
        to: patientEmail,
        from: TRANSPORTER_OPTIONS.auth.user,
        bcc: maillistbcc,
        subject: subjectlang,
        template: 'data_sharing_request_user/_'+lang,
        context: {
          client_server : client_server,
          patientName: patientName,
          ownerUserName: ownerUserName,
          owneremail: owneremail,
          message: message,
          email: email,
          userName: userName,
          patientId: patientId,
          patientEmail: patientEmail,
          lang: lang
        }
      };
    }else{
      mailOptions = {
        to: patientEmail,
        from: TRANSPORTER_OPTIONS.auth.user,
        bcc: maillistbcc,
        subject: subjectlang,
        template: 'data_sharing_request_user_withmsg/_'+lang,
        context: {
          client_server : client_server,
          patientName: patientName,
          ownerUserName: ownerUserName,
          owneremail: owneremail,
          message: message,
          email: email,
          userName: userName,
          patientId: patientId,
          patientEmail: patientEmail,
          lang: lang
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
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMailRequestChangePermissionsUserNewClinician (email, lang, patientEmail, patientName, permissions, message, ownerUserName, owneremail, patientId){
  const decoded = new Promise((resolve, reject) => {

    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var subjectlang= ownerUserName+ ' wants to share your case';

    if(lang=='es'){
      subjectlang=ownerUserName+ ' quiere compartir tu caso';
    }

    var mailOptions = {};
    var temp =  message.replace(/ /g,'')
    if(temp.length==0){
      mailOptions = {
        to: patientEmail,
        from: TRANSPORTER_OPTIONS.auth.user,
        bcc: maillistbcc,
        subject: subjectlang,
        template: 'data_sharing_request_user_new_clinician/_'+lang,
        context: {
          client_server : client_server,
          patientName: patientName,
          ownerUserName: ownerUserName,
          owneremail: owneremail,
          message: message,
          email: email,
          patientId: patientId,
          patientEmail: patientEmail,
          lang: lang
        }
      };
    }else{
      mailOptions = {
        to: patientEmail,
        from: TRANSPORTER_OPTIONS.auth.user,
        bcc: maillistbcc,
        subject: subjectlang,
        template: 'data_sharing_request_user_new_clinician_withmsg/_'+lang,
        context: {
          client_server : client_server,
          patientName: patientName,
          ownerUserName: ownerUserName,
          owneremail: owneremail,
          message: message,
          email: email,
          patientId: patientId,
          patientEmail: patientEmail,
          lang: lang
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
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMailRequestChangePermissionsClinician (email, userName, lang, patientEmail, patientName, permissions, message, ownerUserName, owneremail, patientId){
  const decoded = new Promise((resolve, reject) => {

    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var subjectlang= ownerUserName+ ' needs permission to share your case';

    if(lang=='es'){
      subjectlang=ownerUserName+ ' necesita permiso para compartir tu caso';
    }

    var mailOptions = {};
    var temp =  message.replace(/ /g,'')
    if(temp.length==0){
      mailOptions = {
        to: patientEmail,
        from: TRANSPORTER_OPTIONS.auth.user,
        bcc: maillistbcc,
        subject: subjectlang,
        template: 'data_sharing_request_clinician/_'+lang,
        context: {
          client_server : client_server,
          patientName: patientName,
          ownerUserName: ownerUserName,
          owneremail: owneremail,
          message: message,
          email: email,
          userName: userName,
          patientId: patientId,
          patientEmail: patientEmail,
          lang: lang
        }
      };
    }else{
      mailOptions = {
        to: patientEmail,
        from: TRANSPORTER_OPTIONS.auth.user,
        bcc: maillistbcc,
        subject: subjectlang,
        template: 'data_sharing_request_clinician_withmsg/_'+lang,
        context: {
          client_server : client_server,
          patientName: patientName,
          ownerUserName: ownerUserName,
          owneremail: owneremail,
          message: message,
          email: email,
          userName: userName,
          patientId: patientId,
          patientEmail: patientEmail,
          lang: lang
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
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendEmailInfoPermissions (patientEmail, emailorigen, email, state, lang){
  const decoded = new Promise((resolve, reject) => {
    var urlImg = 'https://www.dx29.ai/assets/img/logo-Dx29.png';

    var maillistbcc = [TRANSPORTER_OPTIONS.auth.user];

    var emailTo = ''
    var subjectlang = ''
    var message = ''
    if(state == 'true'){
      emailTo = email
      maillistbcc.push(emailorigen);
      subjectlang = 'Dx29 - He has agreed to share'
      message = 'has agreed to share'
      if(lang=='es'){
        subjectlang='Dx29 - Ha aceptado compartir';
        message = 'ha aceptado compartir'
      }

    }else{
      emailTo = emailorigen
      subjectlang = 'Dx29 - He has refused to share'
      message = 'has refused to share'
      if(lang=='es'){
        subjectlang='Dx29 - Ha rechazado compartir';
        message = 'ha rechazado compartir'
      }
    }

    var mailOptions = {
      to: emailTo,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: subjectlang,
      template: 'state_info_permissions/_'+lang,
      context: {
        client_server : client_server,
        patientEmail: patientEmail,
        emailorigen: emailorigen,
        email: email,
        message: message
      }
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMailProgramRequestToPatient (patientEmail, clinicalEmail, lang){
  //caso 3
  const decoded = new Promise((resolve, reject) => {
    var urlImg = 'https://www.dx29.ai/assets/img/logo-Dx29.png';

    var maillistbcc = [TRANSPORTER_OPTIONS.auth.user];

    var emailTo = ''
    var subjectlang = ''
    emailTo = patientEmail
    //maillistbcc.push(clinicalEmail);
    subjectlang = 'Dx29 - Request for help to the genetic test - a new email is needed'
    if(lang=='es'){
      subjectlang='Dx29 - Solicitud de ayuda al test genético- se necesita un nuevo correo electrónico';
    }


    var mailOptions = {
      to: emailTo,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: subjectlang,
      template: 'request_email_to_patient/_'+lang,
      context: {
        client_server : client_server,
        patientEmail: patientEmail,
        clinicalEmail: clinicalEmail,
      }
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMailProgramRequestToClinician (patientEmail, clinicalEmail, lang){
  //caso 3
  const decoded = new Promise((resolve, reject) => {
    var urlImg = 'https://www.dx29.ai/assets/img/logo-Dx29.png';

    var maillistbcc = [TRANSPORTER_OPTIONS.auth.user];

    var emailTo = ''
    var subjectlang = ''
    emailTo = clinicalEmail
    //maillistbcc.push(patientEmail);
    subjectlang = 'Dx29 - Request for help to the genetic test - a new email is needed'
    if(lang=='es'){
      subjectlang='Dx29 - Solicitud de ayuda al test genético - se necesita un nuevo correo electrónico';
    }


    var mailOptions = {
      to: emailTo,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: subjectlang,
      template: 'request_email_to_clinician/_'+lang,
      context: {
        client_server : client_server,
        patientEmail: patientEmail,
        clinicalEmail: clinicalEmail,
      }
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMail_request_genetic_program_patient (email, clinicalEmail, lang, patientId, instructionsNewAccount, randomIdRequest){
  //caso 1.1.2
  const decoded = new Promise((resolve, reject) => {
    var urlImg = 'https://www.dx29.ai/assets/img/logo-Dx29.png';

    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var subjectlang='Dx29 - GTP - A clinician is inviting you to discover Dx29 and wants to incorporate you into a genetic testing program - '+ randomIdRequest;

    if(lang=='es'){
      subjectlang='Dx29 - GTP - Un clínico le invita a descubrir Dx29 y quiere incorporarle en un programa de test genético - '+ randomIdRequest;
    }

    if(!instructionsNewAccount){
      subjectlang='Dx29 - GTP - A clinician wants to incorporate you into a genetic testing program - '+randomIdRequest;
      if(lang=='es'){
        subjectlang='Dx29 - GTP - Un clínico quiere incorporarle en un programa de test genético - '+randomIdRequest;
      }
    }

    var attachments = [];
    attachments.push({filename: 'GDPR_1.pdf', path: './documents/Centro_devoluciones.pdf'});
    attachments.push({filename: 'GDPR_2.docx', path: './documents/Riesgos_cambios_en_caliente_en_prod.docx'});

    var mailOptions = {
      to: email,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: subjectlang,
      template: 'request_genetic_program_patient_noinstructions/_'+lang,
      context: {
        client_server : client_server,
        patientId: patientId,
        email: email,
        clinicalEmail: clinicalEmail,
        urlImg: urlImg
      },
      attachments: attachments
    };

    if(instructionsNewAccount){
      mailOptions = {
        to: email,
        from: TRANSPORTER_OPTIONS.auth.user,
        bcc: maillistbcc,
        subject: subjectlang,
        template: 'request_genetic_program_patient_instructions/_'+lang,
        context: {
          client_server : client_server,
          patientId: patientId,
          email: email,
          clinicalEmail: clinicalEmail,
          urlImg: urlImg
        },
        attachments: attachments
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
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMail_request_genetic_program_clinician (email, clinicalEmail, lang, patientId, randomIdRequest){
  //caso 1.1.1
  const decoded = new Promise((resolve, reject) => {
    var urlImg = 'https://www.dx29.ai/assets/img/logo-Dx29.png';

    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var subjectlang='Dx29 - GTP - continue the process - '+randomIdRequest;

    if(lang=='es'){
      subjectlang='Dx29 - GTP - CONTINUAR CON EL PROCESO - '+ randomIdRequest;
    }

    var attachments = [];
    attachments.push({filename: 'GDPR_1.pdf', path: './documents/Centro_devoluciones.pdf'});
    attachments.push({filename: 'GDPR_2.docx', path: './documents/Riesgos_cambios_en_caliente_en_prod.docx'});

    var mailOptions = {
      to: clinicalEmail,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: subjectlang,
      template: 'request_genetic_program_clinician/_'+lang,
      context: {
        client_server : client_server,
        patientId: patientId,
        email: email,
        clinicalEmail: clinicalEmail,
        urlImg: urlImg
      },
      attachments: attachments
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendMailErrorEmail (data, msg){

  const decoded = new Promise((resolve, reject) => {

    var mydata = JSON.stringify(data);
    var mailOptions = {
      to: TRANSPORTER_OPTIONS.auth.user,
      from: TRANSPORTER_OPTIONS.auth.user,
      subject: 'Error sending email: '+ msg,
      template: 'error_send_email/_en',
      context: {
        mydata : mydata
      }
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}


function sendMailNotificationRequest (userName, userEmail, patientName, destiny, email, lang){
  const decoded = new Promise((resolve, reject) => {

    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var subjectlang='Permission to share the case';

    if(lang=='es'){
      subjectlang='Permiso para compartir el caso';
    }

    var mailOptions = {
      to: email,
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: subjectlang,
      template: 'notification_request/_'+lang,
      context: {
        userName: userName,
        userEmail: userEmail,
        patientName: patientName,
        destiny: destiny
      }
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

function sendEmailNotifyPermission (userName, userNameDestiny, patientEmail, emailorigen, lang, state, email){
  const decoded = new Promise((resolve, reject) => {

    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var literalState = 'rejected'
    if(state== "true"){
      literalState = 'approved'
    }

    if(lang=='es'){
      if(state== "true"){
        literalState = 'aprobado';
      }else{
        literalState = 'rechazado';
      }
    }

    var subjectlang='Permission to share the case: '+literalState;

    if(lang=='es'){
      subjectlang='Permiso para compartir el caso: '+literalState;
    }

    var mailOptions = {};

    if(state== "true"){
      mailOptions = {
        to: emailorigen,
        from: TRANSPORTER_OPTIONS.auth.user,
        cc: email,
        bcc: maillistbcc,
        subject: subjectlang,
        template: 'notify_permission_approved/_'+lang,
        context: {
          userName: userName,
          userNameDestiny: userNameDestiny,
          patientEmail: patientEmail
        }
      };
    }else{
      mailOptions = {
        to: emailorigen,
        from: TRANSPORTER_OPTIONS.auth.user,
        bcc: maillistbcc,
        subject: subjectlang,
        template: 'notify_permission_rejected/_'+lang,
        context: {
          userName: userName,
          userNameDestiny: userNameDestiny,
          patientEmail: patientEmail
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
        resolve("ok")
      }
    });

  });
  return decoded
}


function sendMailDev (params){
  const decoded = new Promise((resolve, reject) => {

    var maillistbcc = [
      TRANSPORTER_OPTIONS.auth.user
    ];

    var mailOptions = {
      to: 'dev@foundation29.org',
      from: TRANSPORTER_OPTIONS.auth.user,
      bcc: maillistbcc,
      subject: params.subject,
      template: 'mail_dev/_es',
      context: {
      data : JSON.stringify(params.data)
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        reject({
          status: 401,
          message: 'Fail sending email'
        })
      } else {
        resolve("ok")
      }
    });

  });
  return decoded
}

module.exports = {
	sendMailVerifyEmail,
  sendMailRecoverPass,
  sendMailRequestNewLanguage,
  sendMailRequestNewTranslation,
  sendMailSupport,
  sendMailErrorFromServer,
  sendMailMonarchIsActive,
  sendMailMonarchIsInactive,
  sendMailInvite,
  sendMailShare,
  sendMailNewClinicialShare,
  sendMailRequestChangePermissionsUser,
  sendMailRequestChangePermissionsUserNewClinician,
  sendMailRequestChangePermissionsClinician,
  sendEmailInfoPermissions,
  sendMailProgramRequestToPatient,
  sendMailProgramRequestToClinician,
  sendMail_request_genetic_program_patient,
  sendMail_request_genetic_program_clinician,
  sendMailErrorEmail,
  sendMailNotificationRequest,
  sendEmailNotifyPermission,
  sendMailDev
}
