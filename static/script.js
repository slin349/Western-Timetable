getsubjects(); //executes once website starts and populates the HTML select
document.getElementById('get-subjectlist').addEventListener('change', returnCourseCode); //creates an event listener for course selector
document.getElementById('search').addEventListener('click', displayCourses); //creates an event listener for course selector
document.getElementById('submitcourse').addEventListener('click', addCourseToSchedule);
function getsubjects(){
    fetch("/timetable")
    .then(res => res.json()
    //this part basically achieves the GET on /timetable which gives us all our subjects with course descriptions
    .then(data => {

        var select = document.getElementById('get-subjectlist');

        data.forEach(element => {
            //creates an option element
            option = document.createElement('option');
            //sets the attribute for the element to be the subject
            option.setAttribute('value', element.Subject);
            //sets text to be subject and description
            option.appendChild(document.createTextNode(`Subject: ${element.Subject} Description: ${element.Description}`));
            //appends it to the select
            select.appendChild(option);

        })
    })
    )
}

function returnCourseCode() {
    subjectname = document.getElementById('get-subjectlist').value; //gets the value from the previous selector

    //this is to essentially use the backend GET request for the specific url
    fetch(`/timetable/${subjectname}`)
    .then(res => res.json()

    .then (data => {
        console.log(data);

        var select = document.getElementById('get-coursecode');
        var length = select.options.length; //how big the current select is
        
        //if the select already has options in it, clear them
        if (length != 0){
            for (i=length-1; i>=0; i--){
                select.options[i] = null;
            }
        }

        //adds options to select
        data.forEach(element => {
            //creates an option element
            option = document.createElement('option');
            //sets the attribute for the element to be the subject
            option.setAttribute('value', element.Coursecode);
            //sets text to be subject and description
            option.appendChild(document.createTextNode(`${element.Coursecode}`));
            //appends it to the select
            select.appendChild(option);

        })
    }))
}

function displayCourses() {
    subjectname = document.getElementById('get-subjectlist').value; //gets the value from subject selector
    coursecode = document.getElementById('get-coursecode').value; //gets value from coursecode selector
    component = document.getElementById('classcomponents').value; //gets value from component selector
    document.getElementById('status').innerText = "";

    //for case they want all
    if (component == "ALL"){
        fetch(`/timetable/${subjectname}/${coursecode}`) //fetch based on subject name and coursecode
        .then (res => res.json()
        .then (data => {

            removeListItems();

            data.forEach(element => {
                createClassInfo(element);
            })

        }))
    }
    //for cases they want specific LAB, LEC, TUT
    else {
        fetch(`/timetable/${subjectname}/${coursecode}/${component}`)
        .then(res => {
            if (res.ok) {
                res.json()
                .then(data => {
                    removeListItems();

                    data.forEach(element => {
                        createClassInfo(element);
                    })

                })
            }
            else {
                removeListItems();
                document.getElementById('status').innerText = `Subject: ${subjectname} Coursecode: ${coursecode} with Component: ${component} does not exist`;
                console.log(`Error: ${res.status}`);
            }
        })
    }


}

function removeListItems(){
    const ol = document.getElementById('courseinfolist');
    
    //removes all list elements
    while (ol.firstChild){
        ol.removeChild(ol.firstChild);
    }
}

function addCourseToSchedule(){
    schedulename = document.getElementById('schedulenamebox').value;
    subjectcode = document.getElementById('subjectbox').value;
    coursecode = document.getElementById('coursebox').value;

    fetch (`/timetable/schedule/${schedulename}/${subjectcode}/${coursecode}`,{
        method: 'PUT'
    })
    .then (res => {
        if (res.ok){
            document.getElementById('coursestatus').innerText = `Subject ${subjectcode} and Course ${coursecode} added to ${schedulename}`;
        }
        else {
            if (res.status == 409){
                document.getElementById('coursestatus').innerText = `${schedulename} does not exist!`;
            }
            else if (res.status == 408){
                document.getElementById('coursestatus').innerText = `${coursecode} does not exist!`;
            }
            else if (res.status == 407){
                document.getElementById('coursestatus').innerText = `${subjectcode} does not exist!`;
            }
            else if (res.status == 404){
                document.getElementById('coursestatus').innerText = `Schedule Name does not exist OR Missing Parameters`;
            }
        }
    })
}

function createClassInfo(element){
    const ol = document.getElementById('courseinfolist');

    //this whole part creates the HTML part
    console.log(element.Courseinfo[0]);
    var item = document.createElement('li');

    var subjectNameAndCourseCode = document.createElement("h2");
    subjectNameAndCourseCode.textContent = `${subjectname}: ${coursecode}`;

    var courseData = document.createElement("p");
    courseData.textContent = 
    (`Campus: ${element.Courseinfo[0].campus} 
    Class number: ${element.Courseinfo[0].class_nbr}
    Section: ${element.Courseinfo[0].class_section}
    Days: ${element.Courseinfo[0].days}
    Starts At: ${element.Courseinfo[0].start_time}
    Ends at: ${element.Courseinfo[0].end_time}
    Restriction: ${element.Courseinfo[0].descr} 
    Status: ${element.Courseinfo[0].enrl_stat}
    Facility: ${element.Courseinfo[0].facility_ID}`);

    var classComponent = document.createElement("div");
    classComponent.id = `${element.Courseinfo[0].ssr_component}`;
    classComponent.textContent = `Type: ${element.Courseinfo[0].ssr_component}`;

    item.appendChild(subjectNameAndCourseCode);
    item.appendChild(courseData);
    item.appendChild(classComponent);
    ol.appendChild(item);
}

