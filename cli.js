const lkc = require('./node/entry.js')
const program = require('commander')
const open = require('open');
const inquirer = require('inquirer');

// Option definitions
program
  .option('-d, --debug', 'Be more verbose.')
  .option('-s, --server <>', 'Set the address that should be targetted. Include any ports here.')

program.parse(process.argv)
if(!program.server) {console.error("You're missing the server setting."); process.exit(1)}

console.log("Welcome to the interactive Kitcoin CLI."); // This also serves as a reference implementation.
if(program.debug){
  console.log("Options:");
  if(program.debug) console.log("    The debug switch makes output more verbose.");
  console.log(`    The server parameter is telling the program to connect to ${program.server}`);
}
if (program.debug) console.log("Starting the main function.");
(async ()=>{
	await new Promise(resolve=>lkc.prepare(program.server, false, resolve, true)	)
	console.log("Authorization done.");
  while(true){
    await inquirer.prompt([
      {
        type:"list",
        name:"action",
        message:"Select an action to perform (* requires admin)",
        choices:[
          "Print my balance",
          "Send Kitcoin",
          "Send Kitcoin to a student",
          "*Mint Kitcoin",
          "*Void Kitcoin",
          "*Elevate",
          "Quit"
        ]
      }
    ]).then(async (a)=>{
      switch (a.action) {
        case "Print my balance":
          console.log("Working...");
          var balance = await lkc.balance()
          console.log(balance);
          break;
        case "Send Kitcoin":
          var userInput = await inquirer.prompt([
            {
              type:"input",
              name:"target",
              message:"Who would you like to send Kitcoin to?"
            },
            {
              type:"number",
              name:"amount",
              message:"How much?"
            }
          ])
          console.log("Working...");
          var result = await lkc.send(userInput.target, userInput.amount)
          switch (result.status){
            case "ok": {
              console.log("Done.");
              break;
            }
            case "nonexistentTarget": {
              console.log("Error: Target user does not exist.");
              break;
            }
            case "insufficientBalance": {
              console.log("Error: Your balance is insufficient for this transaction.");
              break;
            }
            case "badInput": {
              console.log("Error: Malformed or incorrect input");
              break;
            }
            default: {
              console.log("Unknown response status");
            }
          }
          break;
        case "Send Kitcoin to a student":
          console.log("Fetching classes...");
          var classesResponse = await lkc.getClasses()
          if(classesResponse.err){
            console.log(`Server error: ${classesResponse.err}`);
          } else if (classesResponse.classes.length == 0) {
            console.log("You have no courses.");
          } else {
            var courses = classesResponse.classes
            var courseNames = []
            courses.forEach((course)=>{
              courseNames.push(`${course.name} (${course.id})`)
            })
            var courseName = (await inquirer.prompt([
              {
                type:'list',
                name:'courseSelect',
                message:"Select your course.",
                choices:courseNames
              }
            ])).courseSelect
            var course
            courses.forEach((i)=>{
              if (courseName == `${i.name} (${i.id})`){
                course = i
              }
            })
            console.log("Fetching students...");
            var studentsResponse = await lkc.students(course.id)
            if(studentsResponse.status == "ServerError"){
              console.log(`Server error.`);
              console.log(studentsResponse.err);
              console.log(studentsResponse.err.errors);
            } else if (studentsResponse.students.length == 0) {
              console.log("You have no courses.");
            } else {
              var students = studentsResponse.students
              var studentNames = []
              students.forEach((i)=>{
                studentNames.push(`${i.profile.name.fullName} (${i.profile.emailAddress})`)
              })
              var studentName = (await inquirer.prompt([
                {
                  type:'list',
                  name:'studentSelect',
                  message:'Select a student.',
                  choices:studentNames
                }
              ])).studentSelect
              var student
              students.forEach((i)=>{
                if(studentName == `${i.profile.name.fullName} (${i.profile.emailAddress})`){
                  student = i
                }
              })
              var userInput = await inquirer.prompt([
                {
                  type:"number",
                  name:"amount",
                  message:"How much?"
                }
              ])
              console.log("Working...");
              var result = await lkc.send(student.profile.emailAddress, userInput.amount)
              switch (result.status){
                case "ok": {
                  console.log("Done.");
                  break;
                }
                case "nonexistentTarget": {
                  console.log("Error: This student is not known to Kitcoin. Make sure they've signed in at least once.");
                  break;
                }
                case "insufficientBalance": {
                  console.log("Error: Your balance is insufficient for this transaction.");
                  break;
                }
                case "badInput": {
                  console.log("Error: Malformed or incorrect input");
                  break;
                }
                default: {
                  console.log("Unknown response status");
                }
            }
          }
          }
          break;
        case "*Mint Kitcoin":
          var userInput = await inquirer.prompt([
            {
              type:"number",
              name:"amount",
              message:"How much to mint?"
            }
          ])
          console.log("Working...");
          var result = await lkc.mint(userInput.amount)
          switch (result.status){
            case "ok": {
              console.log("Done.");
              break;
            }
            case "denied": {
              console.log("Error: You do not have permission to take this action.");
              break;
            }
            case "badInput": {
              console.log("Error: Malformed or incorrect input");
              break;
            }
            default: {
              console.log("Unknown response status");
            }
          }
          break;
        case "*Void Kitcoin":
          var userInput = await inquirer.prompt([
            {
              type:"number",
              name:"amount",
              message:"How much to void?"
            }
          ])
          console.log("Working...");
          var result = await lkc.destroy(userInput.amount)
          switch (result.status){
            case "ok": {
              console.log("Done.");
              break;
            }
            case "denied": {
              console.log("Error: You do not have permission to take this action.");
              break;
            }
            case "badInput": {
              console.log("Error: Malformed or incorrect input");
              break;
            }
            default: {
              console.log("Unknown response status");
            }
          }
          break;
        case "*Elevate":{
          console.log("Preparing elevated action.");
          var input = await inquirer.prompt([
            {
              type:"input",
              name:"procedure",
              message:"Type the name of the procedure you'd like to call."
            },
            {
              type:"input",
              name:"body",
              message:"Type the body of your procedure call. How this is handled is entirely up to the procedure you're calling."
            }
          ])
          var result = await lkc.admin(input.procedure,input.body)
          switch(result.status){
            case "denied":{
              console.log("Error: You do not have permission to take this action."); break;
            }
            case "ok":{
              console.log("Success"); break;
            }
            case "badProcedure":{
              console.log("Error: Unknown procedure"); break;
            }
            case "error":{
              console.log("Unknown server error, possible elaboration in contents"); break;
            }
            case "badInput": {
              console.log("Error: Malformed or incorrect input");
              break;
            }
            default:{
              console.log(`Unknown status message ${result.status}, continuing.`);
            }
          }
          if(result.contents != undefined){
            console.log("Response contains data, displaying.");
            console.log(result.contents);
          }
          break;
        }
        case "Quit":
          process.exit(0);
        default:
          process.exit(1);
      }
    })
  }
})()
