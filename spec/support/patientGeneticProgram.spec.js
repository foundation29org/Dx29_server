var patient = require("../../controllers/all/programs.js")
var inputs = require("./GeneticProgram/geneticProgramEnter.json")
var fs = require("fs");

function geneticProgramMock(input){
    return new Promise (async function(resolve,reject){
        var totalResult = {program:"Genetic Program",result:false,data:[]};
        listPatientSymptoms=input.listPatientSymptoms;
        let listSymptomsToCompare=[]
        listSymptomsToCompare.push('HP:0001250');
        // Sin developmental delay
        //listSymptomsToCompare.push('HP:0001263');
        var listSymptomsExceptions=[];
        let result1 = await patient.checkPatientSymptoms(listPatientSymptoms,listSymptomsToCompare,listSymptomsExceptions);
        let result2 = checkPatientMedicalReportsMock(input.medicalRecords)
        var date;
        if(input.birthdate==null) date = null;
        else date = new Date(input.birthdate)
        let result3 = comparePatientAgeWithValueMock(date,5)
        if((result1.result==true)&&(result2.result==true)&&(result3.result==true)){
            totalResult.result=true;
        }
        else{
            totalResult.result=false;
        }
        totalResult.data.push(result1)
        totalResult.data.push(result2)
        totalResult.data.push(result3)
        resolve(totalResult);
    });
}
function checkPatientMedicalReportsMock(hasMedicalRecords){
    var result = {test:"Medical reports updated",result:hasMedicalRecords,reason:[]}
    if(hasMedicalRecords==false){
        result.reason = ["Container not found"]
    }
    return result;
}
function comparePatientAgeWithValueMock(patientBirthday,age){
    var result = {test:"Patient Age in range",result:false,reason:[]}
    if((patientBirthday==null)||(patientBirthday==undefined)){
        result.result=null;
        result.reason=["Birthdate null"]
    }
    else{
        var today= Date.now();
        var dateCreated = new Date(today-patientBirthday.getTime())
        var agePatient = dateCreated.getUTCFullYear() - 1970;
        if(agePatient<age){
            result.result=true;
        }
        else{
            result.reason.push(agePatient)
        }
    }
    return result;
}
describe ("Program 1: Genetic testing",function(){
    var totalResult=[];
    beforeEach(function(){
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
    })
    beforeAll(done=>{
        for(var i=0;i<inputs.length;i++){
            totalResult.push({test:inputs[i].testCase,result:[]})
        }
    })
    inputs.forEach((input,i)=>{
        it("Test: "+input.testCase,async function(){
            var result = await geneticProgramMock(input);
            totalResult[i].result.push({program:"Genetic Program",result:result.result,data:result.data});
        }) 
    })
    afterEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
    afterAll(done=>{
        fs.writeFile('./spec\/support/GeneticProgram/geneticProgramOutput.json', JSON.stringify(totalResult,null,4), function(err) {
            if (err) {
                return console.error(err);
            }
            else{
                console.log("\n Output document updated")
                totalResult=[];
            }
        });
    })
})