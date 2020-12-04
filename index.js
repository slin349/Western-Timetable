//import
require('dotenv').config();

const express = require('express');
const app = express();
const router = express.Router();
const fs = require('fs'); //this is for node.js file system
const jsonFile = require('./data/schedule.json');
const userFile = require('./data/users.json');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailvalidator = require('email-validator');
const cookiez = require('cookie-parser');
const stringSimilarity = require('string-similarity');

// ./ means in the current same level, and ../ means one file backwards
//this line imports the data from another file
const datab = require('./data/Lab3-timetable-data');

//defines port
const port = process.env.PORT || 3000;

//cookie parser
app.use(cookiez());

//sanitization
//checks to see if database has coursecode
function sanitizeCourseCode(ins){
    const chkr = datab.find(p => p.catalog_nbr == ins);

    //if exists in database
    if (chkr) {
        return true;
    }
    else{
        return false;
    }
}

//compares it with database to see if subject exists
function sanitizeSubjectCode(ins){
    const chkr = datab.find(p => p.subject === ins);
    
    //if exists in database
    if (chkr) {
        return true;
    }
    else{
        return false;
    }
}

//checks if the course component is only LAB OR TUT OR LEC
function sanitizeCourseComponent(ins){
    if (ins === "LAB" || ins === "TUT" || ins === "LEC") {
        return true;
    }
    else {
        return false;
    }
}

//this one checks if special characters are used in string
function sanitizeScheduleName(ins){
    var specialchars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

    if (specialchars.test(ins)){
        return false;
    }
    else {
        return true;
    }
}

//this is to prevent CORS errors/
app.use((req, res, next) => {
    //the starts says allow request from any _
    res.header('Access-Control-Allow-Origin', 'http://localhost:4200'); //origin
    res.header('Access-Control-Allow-Headers', 'content-type'); //header
    res.setHeader('Access-Control-Allow-Credentials', true);
    if(req.method === 'OPTIONS'){
      res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, PUT');//methods
      return res.status(200).json({});
    }
    next();
  })

//when on base page, it will display html from static folder
app.use('/', express.static('static/western-timetable'));

//middleware to do logging
app.use((req, res, next) => { //everytime someone uses the server, it checks all routes and consoles out the request
    console.log(`${req.method} request for ${req.url}`);
    next(); //keep going
})

//middleware to parse data in body as JSON used for POST and PUT
router.use(express.json());

//middleware to parse data in body as JSON used for POST and PUT
app.use(express.json());

//when accessing /api/timetable/subject
router.route('/')
    //get all subjects
    .get((req,res) => {
        //map so we only get array with subjects and descriptions
        const subjects = datab.map(p => {
            return {Subject: p.subject, Description: p.className}
        })

        res.send(subjects);
    })

//routing to get all schedules
router.route('/schedule_all')
    .get ((req, res) => {
        //list to store objects
        var list = [];

        //creates a new array that contains all the JSON objects
        var x = (Object.entries(jsonFile));

        //check for case of no schedules
        if (x.length == 0) {
            return res.status(404).send(`There are no schedules`);
        }

        //itterate through array to find schedule name
        for (i=0; i<x.length; i++){
            //finds schedule name
            schedulename = x[i][0];
            //using schedule name determine number of courses through keys
            numofcourses = (Object.keys(jsonFile[schedulename]).length)-3;

            //create object
            tempobj = {
                "ScheduleName": schedulename,
                "NumberofCourses": numofcourses
            }

            //push object
            list.push(tempobj);
        }

        res.send(list);
    })


//route for creating public schedules
router.route('/createschedule/:schedulename/:authorname?/:description?')

    //when user wants to create new schedule
    //use post because you are not trying to overwrite
    .post (authToken, (req, res) => {
        const schedulename = req.params.schedulename; //gets the user inputted body
        const author = req.params.authorname;
        var description = req.params.description;
        const email = req.useremail.email;
        const isPublic = true;

        const date = new Date();

        const todaysDate = (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
        const todaysValue = Date.now();

        var chkr = sanitizeScheduleName(schedulename);
        var authorchkr = sanitizeScheduleName(author);
        var chkr2 = sanitizeScheduleName(author);
        var chkr3 = sanitizeScheduleName(description);

        //check if author is left empty
        if (author == undefined){
            return res.status(404).send(`Author is needed to create schedule`);
        }

        //check if description is left empty
        if (description == undefined){
            description = "No description";
        }

        //if true sanitization returns true
        if (!chkr){
            return res.status(404).send(`Special characters inputted! NOT ALLOWED!`);
        }

        //if true sanitization returns true
        if (!chkr2){
            return res.status(404).send(`Special characters inputted! NOT ALLOWED!`);
        }

        //if true sanitization returns true
        if (!chkr3){
            return res.status(404).send(`Special characters inputted! NOT ALLOWED!`);
        }

        //check if input has special characters
        if (!authorchkr){
            return res.status(404).send(`Special characters inputted! NOT ALLOWED!`);
        }

        //check if JSON file already has server name
        if (jsonFile[schedulename] !== undefined) {
            return res.status(409).send(`Schedule name ${schedulename} exists!`);
        }

        jsonFile[schedulename] = [schedulename, author, description, email, isPublic, todaysDate, todaysValue]; //this includes the data to the file however does not save it
        const data = JSON.stringify(jsonFile); //convert to JSON

        //writing to JSON file
        fs.writeFile('./data/schedule.json', data, (err) => {
            if (err){
                throw err;
            }
            console.log(`Schedule name ${schedulename} is added.`);
            res.status(200).send(`Schedule name ${schedulename} is added.`);
        })
    })

//this routing allows optional parameter
router.route('/schedule/:schedulename/:subjectcode?/:coursecode?')
    
    //use put because you are replacing data
    //adds/replaces courses to schedule
    .put (authToken, (req, res) => {
        const schedulename = req.params.schedulename;
        const subjectcode = req.params.subjectcode;
        const coursecode = req.params.coursecode;
        const todayzDate = new Date();
        const email = req.useremail.email;

        const modifyDate = (todayzDate.getMonth()+1) + "/" + todayzDate.getDate() + "/" + todayzDate.getFullYear() + " " + todayzDate.getHours() + ":" + todayzDate.getMinutes() + ":" + todayzDate.getSeconds();
        const todaysTime = Date.now();

        //sanitization
        var chkr = sanitizeScheduleName(schedulename);
        var chkr2 = sanitizeSubjectCode(subjectcode);
        var chkr3 = sanitizeCourseCode(coursecode);

        //check if JSON file does not have schedulename
        if (jsonFile[schedulename] == undefined) {
            return res.status(409).send(`Schedule name ${schedulename} does not exist!`);
        }
        
        if (!chkr){
            return res.status(404).send(`Special characters inputted! NOT ALLOWED!`);
        }
        else if (!chkr2) {
            return res.status(405).send(`${subjectcode} is not allowed!`);
        }
        else if (!chkr3){
            return res.status(408).send(`${coursecode} is not allowed!`);
        }

        //check if user is owner of schedule
        //if user tries to change someone elses cchedule
        if (jsonFile[schedulename][3] != email){
            return res.status(400).send('Schedule does not belong to you!')
        }

        //loop to check every element in array
        for (i=0; i<jsonFile[schedulename].length; i++){
            //check to see if subjectcode and coursecode pair exists then replace
            if (jsonFile[schedulename][i].SubjectCode === subjectcode && jsonFile[schedulename][i].CourseCode === coursecode){

                jsonFile[schedulename][i].SubjectCode = subjectcode;
                jsonFile[schedulename][i].CourseCode = coursecode;
                jsonFile[schedulename][5] = modifyDate;
                jsonFile[schedulename][6] = todaysTime;

                const data = JSON.stringify(jsonFile);

                //writing to JSON file
                fs.writeFile('./data/schedule.json', data, (err) => {
                    if (err){
                        throw err;
                    }
                    console.log(`Updated subject code and course code for ${schedulename}`);
                })   
                return res.status(200).send(`Subjectcode ${subjectcode} and Coursecode ${coursecode} Updated for ${schedulename}`);
            }
        }

        //create new object assuming it does not exist
        const userobject = {
            "SubjectCode": subjectcode,
            "CourseCode": coursecode
        }

        jsonFile[schedulename][5] = modifyDate;
        jsonFile[schedulename][6] = todaysTime;

        jsonFile[schedulename].push(userobject); //push to JSON file array

        const data = JSON.stringify(jsonFile);

        //writing to JSON file
        fs.writeFile('./data/schedule.json', data, (err) => {
            if (err){
                throw err;
            }
            console.log(`Adding SubjectCode ${subjectcode} and CourseCode ${coursecode} to ${schedulename}`);
            res.status(200).send(`Subjectcode ${subjectcode} and Coursecode ${coursecode} added to ${schedulename}`);
        })    
    })
    
    //GET subject code and course codes for specific schedule
    .get ((req, res) => {
        const schedulename = req.params.schedulename;

        var ckhr = sanitizeScheduleName(schedulename);

        if (!ckhr){
            return res.status(404).send(`Special characters inputted! NOT ALLOWED!`);
        }

        //check if JSON file does not have schedulename
        if (jsonFile[schedulename] == undefined) {
            return res.status(409).send(`Schedule name ${schedulename} does not exist!`);
        }

        var data = jsonFile[schedulename];

        res.send(data);
    })

    //delete specific schedule given name
    .delete (authToken, (req, res) => {
        const schedulename = req.params.schedulename;
        const email = req.useremail.email;
        
        //sanitize
        var chkr = sanitizeScheduleName(schedulename);

        if (!chkr) {
            return res.status(404).send(`Special characters inputted! NOT ALLOWED!`);
        }

         //check if JSON file does not have schedulename
        if (jsonFile[schedulename] == undefined) {
            return res.status(409).send(`Schedule name ${schedulename} does not exist!`);
        }

        //check if schedule is owned by person
        if (jsonFile[schedulename][3] != email){
            return res.status(400).send('Schedule not owned by you. Can not delete!');
        }

        //deletes it from JSON file
        delete jsonFile[schedulename];

        const data = JSON.stringify(jsonFile);

        //writing to JSON file
        fs.writeFile('./data/schedule.json', data, (err) => {
            if (err){
                throw err;
            }
            console.log(`Deleted ${schedulename} from database`);
        })   
        return res.status(200).send(`Deleted ${schedulename} from schedule`);
    })

//when user enters specific subject id
router.route('/:subjectcode')

    //get all course codes with specific subject code
    .get((req, res) => {
        //initializes the users input to a variable
        const subjcode = req.params.subjectcode;

        //sanitization
        var chkr1 = sanitizeSubjectCode(subjcode);

        //if true sanitization returns true
        if (!chkr1){
            return res.status(404).send(`Subject ${subjcode} was not found!`);
        }

        //check to see if database has any subject code that matches with user input
        const chkr = datab.find(p => p.subject === subjcode);

        const coursecode = datab.filter(p => p.subject === subjcode); //creates a new array that filters out wher subject is equal to user input

        const result = coursecode.map(element => { //maps the filtered array so that it only shows course code and stores it in new array called result
            return {Coursecode: element.catalog_nbr}
        })
        res.send(result); //sends out result
    })
    

//when user wants to enter subject code and course code with optional component   
router.route('/:subjectcode/:course/:component?')
    .get((req, res) => {
        //initialize the user input
        const subjcode = req.params.subjectcode;
        const coursecode = req.params.course;
        const component = req.params.component;

        //sanitization
        var chkr2 = sanitizeSubjectCode(subjcode);
        var chkr3 = sanitizeCourseCode(coursecode);
        var chkr4 = sanitizeCourseComponent(component);
        
        //sanitization
        if (!chkr2) {
            return res.status(404).send(`${subjcode} is not allowed!`);
        }
        else if (!chkr3){
            return res.status(404).send(`${coursecode} is not allowed!`);
        }

        // looks for the specific subject and coursecode and checks if it exists
        const chkr = datab.find(p => (p.subject === subjcode && p.catalog_nbr == coursecode));

        if (typeof component == "undefined" && chkr){
            const newarray = datab.filter(p => p.subject === subjcode && p.catalog_nbr == coursecode); //creates a new array that filters out where subject is equal to user input
            
            const subjectname = (newarray[0].subject);
            const coursecodenum = (newarray[0].catalog_nbr);
            const classnamez = (newarray[0].className);

            //map to create new array that just has the courseinfo
            const resultarray = newarray.map(element => {
                return {subject: subjectname, catalog_nbr: coursecodenum, className: classnamez, course_info: element.course_info}
            })

            res.send(resultarray); //sends out result
        }
        else if (typeof component != "undefined" && chkr){ //if user inputed the optional component

            //sanitization
            if (!chkr4) {
                return res.status(404).send(`${component} is not allowed!`);
            }

            const chkr2 = datab.find(p => (p.subject === subjcode && p.catalog_nbr == coursecode && p.course_info[0].ssr_component === component)); //checks if it exists first

            if (chkr2) {
                const newarray = datab.filter(p => p.subject === subjcode && p.catalog_nbr == coursecode && p.course_info[0].ssr_component === component); //creates a new array that filters out where subject is equal to user input
                
                const subjectname = (newarray[0].subject);
                const coursecodenum = (newarray[0].catalog_nbr);
                const classnamez = (newarray[0].className);

                //map to create new array that just has the courseinfo
                const resultarray = newarray.map(element => {
                    return {Subject: subjectname, Catalog_nbr: coursecodenum, ClassName: classnamez, Courseinfo: element.course_info}
                })
    
                res.send(resultarray);    
            }
            else { //if we cant find component
                res.status(404).send(`Subject ${subjcode} with Coursecode ${coursecode} and Component ${component} was not found!`)
            }

        }
        else {
            res.status(404).send(`Subject ${subjcode} with Coursecode ${coursecode} was not found!`);
        }
    })

//registering user to datab
app.post('/users', async (req, res) => {
    const user = {email: req.body.email, name: req.body.username, password: req.body.password, disabled: 'false', verified: 'false', admin: 'false'}

    //check to see if email is valid format
    const validator = emailvalidator.validate(`${req.body.email}`);

    const checker = sanitizeScheduleName(user.name);

    //if email is left blank
    if (req.body.email == "") {
        return res.status(400).send('Missing email entry, please enter email');
    }

    //if username is left blank
    if (req.body.username == "") {
        return res.status(400).send('Missing username entry, please enter username');
    }

    //if password is left blank
    if (req.body.password == "") {
        return res.status(400).send('Missing password entry, please enter password');
    }

    //if not valid
    if (validator == false) {
        return res.status(400).send('Email format not valid');
    }
    
    //if user already exists in database
    if (userFile[`${req.body.email}`] != undefined) {
        return res.status(400).send('User already registerd');
    }

    //if true sanitization returns true
    if (!checker){
        return res.status(404).send(`Special characters inputted! NOT ALLOWED!`);
    }
   
    try {
        //this part creates the hashed password using bcrypts salt, 10 being default
        const hashPass = await bcrypt.hash(req.body.password, 10);

        //writing to database
        userFile [user.email]= [user.name, hashPass, user.disabled, user.verified, user.admin]; //this includes the data to the file however does not save it
        const data = JSON.stringify(userFile); //convert to JSON

        //writing to JSON file
        fs.writeFile('./data/users.json', data, (err) => {
            if (err){
                throw err;
            }
            console.log(`User added ${user.name}`);
            
            res.status(201).send(`http://localhost:3000/users/login/${user.email}`);
        })
    } catch {
        res.status(500).send();
    }
    
})

//logging in user
app.post('/users/login', async (req, res) => {
    
    const userpass = req.body.password;
    const email = req.body.email;

    //search in json file if email exists
    const user = userFile[`${email}`];

    //object for user email
    const useremailobject = { email: email};
    
    //if email cannot be found in database
    if (user === undefined){
        return res.status(400).send('Cannot find user with email');
    }
    
    try {
        //compare the two passwords
        //if successful, user[1] refers to the json object and 1 is the index of the array that holds hashed password
        if (await bcrypt.compare(userpass, user[1])){

            //if account is set to dissabled
            if (user[2] == "true") {
                return res.status(500).send('Account is dissabled, please contact admin');
            }

            //check to see if verified
            if (user[3] == "false") {
                return res.status(500).send('Account needs to be verified');
            }

            //creating access token and has user email saved inside
            const accessToken = generateAccessToken(useremailobject);

            //creating a access token
            res.cookie("useraccesstoken", accessToken, {
                httpOnly: true,
                secure: false
            })

            res.send('Successful login');
        }
        //if not successful
        else {
            res.status(500).send('Login not successful');
        }

    }catch {
        return res.status(500).send('Password incorrect');
    }
    
})

//with access from user, we can do function
app.get('/users', authToken, (req, res) => {
    //if entered correct token, they can see their information
    res.send(userFile[`${req.useremail.email}`]);
})

//allow user to change password
app.post('/changepassword/:password', authToken, async (req, res) => {
    const newpass = req.params.password;
    const email = req.useremail.email;

    //hash the password
    const hashPass = await bcrypt.hash(newpass, 10);

    //change password
    userFile[`${email}`][1] = hashPass;

    const data = JSON.stringify(userFile); //convert to JSON

        //writing to JSON file
        fs.writeFile('./data/users.json', data, (err) => {
            if (err){
                throw err;
            }
            res.status(201).send(`Password Changed`);
        })

})

//verifying email
app.get('/users/login/:email', (req, res) => {
    const email = req.params.email;

    //change to true for verified
    userFile[`${email}`][3] = "true";

    //write to file
    const data = JSON.stringify(userFile);

    //writing to JSON file
    fs.writeFile('./data/users.json', data, (err) => {
        if (err){
            throw err;
        }
        console.log(`${email} is verified!`);
    })
    
    res.send(`${email} is verified!`);

})

//resend verification
app.get('/users/reverify/:email', (req, res) => {
    const email = req.params.email;

    res.status(201).send(`http://localhost:3000/users/login/${email}`);
})

//disabling account
app.post('/admin/disable', (req, res) => {
    const email = req.body.email;

    //change to true for disabling an account
    userFile[`${email}`][2] = "true";

    //write to file
    const data = JSON.stringify(userFile);

    //writing to JSON file
    fs.writeFile('./data/users.json', data, (err) => {
        if (err){
            throw err;
        }
        console.log(`${email} is disabled!`);
    })
    
    res.send(`${email} is disabled!`);
})

//enabling account
app.post('/admin/enable', (req, res) => {
    const email = req.body.email;

    //change to true for disabling an account
    userFile[`${email}`][2] = "false";

    //write to file
    const data = JSON.stringify(userFile);

    //writing to JSON file
    fs.writeFile('./data/users.json', data, (err) => {
        if (err){
            throw err;
        }
        console.log(`${email} is enabled!`);
    })
    
    res.send(`${email} is enabled!`);
})

//logging out user
app.post('/users/logout', (req, res) => {
    //clear cookie
    res.clearCookie("useraccesstoken", { httpOnly: true, secure: false});
    return res.status(200).send({message: "Logout Success"})
})

//searching by keyword
app.get('/search/:searchz', (req, res) => {
    const keyword = req.params.searchz;

    //to remove white space
    const keywordModified = keyword.replace(/\s/g, "");

    const keywordUpper = keywordModified.toUpperCase();
    const keywordLower = keywordModified.toLowerCase();

    const result = [];

    const chkr = sanitizeScheduleName(keyword);

    //check if special characters are inputted
    if (!chkr) {
        return res.status(400).send("Special characters are not allowed!");
    }
    
    //check if keyword is 4 characters
    if (keyword.length < 4) {
        return res.status(400).send("Keyword must be atleast 4 characters long");
    }

    //itterate through database and see if courses exist with given keyword
    datab.forEach(content => {
        const coursecodeandcoursename = content.catalog_nbr + content.className;
        const courseLowercase = content.catalog_nbr + (content.className).toLowerCase();
        const courseNum = content.catalog_nbr;

        //checks the similarity to perform soft matching
        const similaritychk = stringSimilarity.compareTwoStrings(`${keyword}`, `${courseNum}`);
        const similaritycheckOne = stringSimilarity.compareTwoStrings(`${keywordModified}`, `${coursecodeandcoursename}`);
        const similaritycheckTwo = stringSimilarity.compareTwoStrings(`${keywordUpper}`, `${coursecodeandcoursename}`);
        const similaritycheckThree = stringSimilarity.compareTwoStrings(`${keywordLower}`, `${courseLowercase}`);

        //basically if half of the content is similar then move it into list
        if (similaritychk > 0.7 || similaritycheckOne > 0.3 || similaritycheckTwo > 0.25 || similaritycheckThree > 0.3) {
            result.push(content);
        }

    })

    res.send(result);
})

//create private schedules for auth users
app.post('/privateschedules/create/:schedulename/:authorname?/:description?', authToken, (req, res) => {
    const schedulename = req.params.schedulename; //gets the user inputted body
    const author = req.params.authorname;
    var description = req.params.description;
    const email = req.useremail.email;
    const isPublic = false;

    const date = new Date();

    const todaysDate = (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    const todaysValue = Date.now();

    var chkr = sanitizeScheduleName(schedulename);
    var authorchkr = sanitizeScheduleName(author);

    //check if author is left empty
    if (author == undefined){
        return res.status(404).send(`Author is needed to create schedule`);
    }

    //check if description is left empty
    if (description == undefined){
        description = "No description";
    }

    //if true sanitization returns true
    if (!chkr){
        return res.status(404).send(`Special characters inputted! NOT ALLOWED!`);
    }

    //check if input has special characters
    if (!authorchkr){
        return res.status(404).send(`Special characters inputted! NOT ALLOWED!`);
    }

    //check if JSON file already has server name
    if (jsonFile[schedulename] !== undefined) {
        return res.status(409).send(`Schedule name ${schedulename} exists!`);
    }

    //check if there are already 20 schedules
    var list = [];

    //creates a new array that contains all the JSON objects
    var x = (Object.entries(jsonFile));

    for (i=0; i<x.length; i++){
        if (x[i][1][3] == email){
            list.push(x[i]);
        }
    }

    //if there are already 20 schedules
    if (list.length >= 20){
        return res.status(400).send('Schedule limit is 20: LIMIT REACHED');
    }

    jsonFile[schedulename] = [schedulename, author, description, email, isPublic, todaysDate, todaysValue]; //this includes the data to the file however does not save it
    const data = JSON.stringify(jsonFile); //convert to JSON

    //writing to JSON file
    fs.writeFile('./data/schedule.json', data, (err) => {
        if (err){
            throw err;
        }
        console.log(`Schedule name ${schedulename} is added.`);
        res.status(200).send(`Schedule name ${schedulename} is added.`);
    })
})

//view schedules for specific user
app.get('/privateschedule/view', authToken, (req, res) => {
    const email = req.useremail.email;

    //list to store objects
    var list = [];

    //creates a new array that contains all the JSON objects
    var x = (Object.entries(jsonFile));

    //check for case of no schedules
    if (x.length == 0) {
        return res.status(404).send(`There are no schedules`);
    }

    
    //itterate through array to find specific schedules that are from the user
    for (i=0; i<x.length; i++){

        //finds schedule name
        if (x[i][1][3] == email){
            //finds schedule name
            schedulename = x[i][0];
            //using schedule name determine number of courses through keys
            numofcourses = (Object.keys(jsonFile[schedulename]).length)-3;
            //create object
            tempobj = {
                "ScheduleName": schedulename,
                "NumberofCourses": numofcourses
            }
            //push object
            list.push(tempobj);
        }
    }

    res.send(list);

})

//set current users post to public
app.post('/privateschedule/change/public/:schedulename', authToken, (req, res) => {
    const email = req.useremail.email;
    const schedulename = req.params.schedulename;

    const chkr = sanitizeScheduleName(schedulename);

    //if user tries to enter special characters
    if (!chkr) {
        return res.status(400).send('SPECIAL CHARACTERS ARE NOT ALLOWED!');
    }

    //look for the schedule name and see if it exists
    if (jsonFile[schedulename] == undefined){
        return res.status(400).send('Schedule does not exist');
    }


    //if user tries to change someone elses cchedule
    if (jsonFile[schedulename][3] != email){
        return res.status(400).send('Schedule does not belong to you!')
    }

     //change to public
     jsonFile[schedulename][4] = true;

     const data = JSON.stringify(jsonFile); //convert to JSON
 
         //writing to JSON file
         fs.writeFile('./data/schedule.json', data, (err) => {
             if (err){
                 throw err;
             }
             res.status(201).send(`Schedule changed to public`);
         })
})

//set current users post to private
app.post('/privateschedule/change/private/:schedulename', authToken, (req, res) => {
    const email = req.useremail.email;
    const schedulename = req.params.schedulename;

    const chkr = sanitizeScheduleName(schedulename);

    //if user tries to enter special characters
    if (!chkr) {
        return res.status(400).send('SPECIAL CHARACTERS ARE NOT ALLOWED!');
    }

    //look for the schedule name and see if it exists
    if (jsonFile[schedulename] == undefined){
        return res.status(400).send('Schedule does not exist');
    }


    //if user tries to change someone elses cchedule
    if (jsonFile[schedulename][3] != email){
        return res.status(400).send('Schedule does not belong to you!')
    }

     //change to public
     jsonFile[schedulename][4] = false;

     const data = JSON.stringify(jsonFile); //convert to JSON
 
         //writing to JSON file
         fs.writeFile('./data/schedule.json', data, (err) => {
             if (err){
                 throw err;
             }
             res.status(201).send(`Schedule changed to private`);
         })
})

//check if user is admin
app.get('/admin/auth', authToken, (req, res) => {
    const email = req.useremail.email;

    //check if user is admin
    if (userFile[email][0] === "admin"){
        return res.status(200).send('You are admin');
    }

    res.status(404).send('You are not admin');
})

//get all users
app.get('/admin/allusers', authToken, (req, res) => {

    list = [];

    //check if user is admin
    if (userFile[email][0] !== "admin"){
        return res.status(404).send('You are not admin!');
    }

    
})
//give other users admin
app.put('/admin/grant/access', authToken, (req, res) => {

})

//middleware to authenticate json web token
function authToken(req, res, next) {
    const userauthtoken = req.cookies.useraccesstoken;

    //chekc if token is valid if not, send no permission
    if (userauthtoken == null) {
        return res.sendStatus(401);
    }

    //verify token
    jwt.verify(userauthtoken, process.env.ACCESS_TOKEN_SECRET, (err, useremailobject) => {
        //if token is not valid
        if (err) {
            return res.sendStatus(403).send('No access');
        }
        req.useremail = useremailobject;
        next();
    })
}

//create function to create an accesstoken
function generateAccessToken(useremailobject) {
    //return the token with expiration time of 1hr
    return jwt.sign(useremailobject, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "1h"});
}

//Router for /timetable
app.use ('/timetable', router);

//starts the server
app.listen(port, ()=>{
    console.log(`Listening on port: ${port}`);
})