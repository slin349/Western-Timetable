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

// ./ means in the current same level, and ../ means one file backwards
//this line imports the data from another file
const datab = require('./data/Lab3-timetable-data');

//defines port
const port = process.env.PORT || 3000;

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
            numofcourses = (Object.keys(jsonFile[schedulename]).length)-1;

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

    .delete ((req, res) => {
        //creates a new array that contains all the JSON objects
        var x = (Object.entries(jsonFile));

        //if no schedules exist
        if (x.length == 0) {
            return res.send(`There are no schedules to delete`)
        }

        //loop and delete schedules
        for (i=0; i<x.length; i++){
            schedulename = x[i][0];
            delete jsonFile[schedulename];
        }

        const data = JSON.stringify(jsonFile);

        //writing to JSON file
        fs.writeFile('./data/schedule.json', data, (err) => {
            if (err){
                throw err;
            }
        })   
        return res.send(`Deleted all schedules`);
    })


//this routing allows optional parameter
router.route('/schedule/:schedulename/:subjectcode?/:coursecode?')

    //when user wants to create new schedule
    //use post because you are not trying to overwrite
    .post ((req, res) => {
        const schedulename = req.params.schedulename; //gets the user inputted body

        var chkr = sanitizeScheduleName(schedulename);

        //if true sanitization returns true
        if (!chkr){
            return res.status(404).send(`Special characters inputted! NOT ALLOWED!`);
        }

        //check if JSON file already has server name
        if (jsonFile[schedulename] !== undefined) {
            return res.status(409).send(`Schedule name ${schedulename} exists!`);
        }

        jsonFile[schedulename] = [schedulename]; //this includes the data to the file however does not save it
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
    
    //use put because you are replacing data
    //adds/replaces courses to schedule
    .put ((req, res) => {
        const schedulename = req.params.schedulename;
        const subjectcode = req.params.subjectcode;
        const coursecode = req.params.coursecode;
        
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

        //loop to check every element in array
        for (i=0; i<jsonFile[schedulename].length; i++){
            //check to see if subjectcode and coursecode pair exists then replace
            if (jsonFile[schedulename][i].SubjectCode === subjectcode && jsonFile[schedulename][i].CourseCode === coursecode){

                jsonFile[schedulename][i].SubjectCode = subjectcode;
                jsonFile[schedulename][i].CourseCode = coursecode;

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
    .delete ((req, res) => {
        const schedulename = req.params.schedulename;

        //sanitize
        var chkr = sanitizeScheduleName(schedulename);

        if (!chkr) {
            return res.status(404).send(`Special characters inputted! NOT ALLOWED!`);
        }

         //check if JSON file does not have schedulename
        if (jsonFile[schedulename] == undefined) {
            return res.status(409).send(`Schedule name ${schedulename} does not exist!`);
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
        return res.send(`Deleted ${schedulename} from schedule`);
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
            
            //map to create new array that just has the courseinfo
            const resultarray = newarray.map(element => {
                return {Courseinfo: element.course_info}
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
            
                //map to create new array that just has the courseinfo
                const resultarray = newarray.map(element => {
                    return {Courseinfo: element.course_info}
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

//adding user to datab
app.post('/users', async (req, res) => {
    const user = {email: req.body.email, name: req.body.username, password: req.body.password, disabled: 'false', verified: 'false'}

    //check to see if email is valid format
    const validator = emailvalidator.validate(`${req.body.email}`);

    //if email is left blank
    if (req.body.email === undefined) {
        return res.status(400).send('Missing email entry, please enter email');
    }

    //if username is left blank
    if (req.body.username === undefined) {
        return res.status(400).send('Missing username entry, please enter username');
    }

    //if password is left blank
    if (req.body.password === undefined) {
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
   
    try {
        //this part creates the hashed password using bcrypts salt, 10 being default
        const hashPass = await bcrypt.hash(req.body.password, 10);

        //writing to database
        userFile [user.email]= [user.name, hashPass, user.disabled, user.verified]; //this includes the data to the file however does not save it
        const data = JSON.stringify(userFile); //convert to JSON

        //writing to JSON file
        fs.writeFile('./data/users.json', data, (err) => {
            if (err){
                throw err;
            }
            console.log(`User added ${user.name}`);
            res.status(201).send("Successful add!");
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
            //creating access token and has user email saved inside
            const accessToken = generateAccessToken(useremailobject);

            //creating a refresh token
            res.json({accessToken: accessToken});
        }
        //if not successful
        else {
            res.send('Login not successful');
        }

    }catch {
        return res.status(500).send();
    }
    
})

//with access from user, we can do function
app.get('/users', authToken, (req, res) => {
    //if entered correct token, they can see their information
    res.send(userFile[`${req.useremail.email}`]);
})

//verifying email
app.post('/users/login/verify', (req, res) => {
    const email = req.body.email;

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

//logging out user !@#$!@$!@$!@ NEED TO DO SOMEHOW rn, token expiring is kinda like logging out
app.delete('/users/logout', (req, res) => {
    
})

//middleware to authenticate json web token
function authToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    //if there is an authHeader, then return authHeader token portion
    const token = authHeader &&authHeader.split(' ')[1]

    //chekc if token is valid if not, send no permission
    if (token == null) {
        return res.sendStatus(401);
    }

    //verify token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, useremailobject) => {
        //if token is not valid
        if (err) {
            return res.sendStatus(403);
        }
        req.useremail = useremailobject;
        next();
    })
}

//create function to create an accesstoken
function generateAccessToken(useremailobject) {
    //return the token with expiration time of 10 minutes
    return jwt.sign(useremailobject, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "10m"});
}

//Router for /timetable
app.use ('/timetable', router);

//starts the server
app.listen(port, ()=>{
    console.log(`Listening on port: ${port}`);
})