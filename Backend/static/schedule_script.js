displaySchedule(); //executes once website starts
document.getElementById('schedulenamesubmit').addEventListener('click', createSchedule); //creates an event listener for the schedule form
document.getElementById('deleteall').addEventListener('click', deleteSchedules);
document.getElementById('deletebutton').addEventListener('click', deleteSpecificSchedule);

//creating schedule
function createSchedule(){
    schedulename = document.getElementById('schedulenamebox').value; //value of textfield

    fetch (`/timetable/schedule/${schedulename}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then (res => {
        if (res.ok){
            document.getElementById('schedulestatus').innerText = `${schedulename} has been added!`;
            displaySchedule();
        }
        else {
            console.log(`Error: ${res.status}`);
            if (res.status == "409") {
                document.getElementById('schedulestatus').innerText = `${schedulename} exists!`;
            }
            else if (res.status == "404") {
                document.getElementById('schedulestatus').innerText = `Special characters are not allowed as inputs!`;
            }
        }
    })

}

//function to delete all schedules
function deleteSchedules(){
    fetch (`/timetable/schedule_all`, {
        method: 'DELETE'
    })
    .then (res => {
        document.getElementById('schedulestatus').innerText = `All schedules deleted`;
        removeListItems();
    })
}

function displaySchedule(){

    fetch (`/timetable/schedule_all`)
    .then (res => {
        if (res.ok){
            res.json()
            .then (data => {
                removeListItems();

                data.forEach(element => {
                    findCourses(element.ScheduleName);
                })
            })
        }
        else {
            console.log(`Error: ${res.status}`);
            if (res.status == "404") {
                document.getElementById('schedulestatus').innerText = `There are no schedules`;
            }
        }
    })
}

function removeListItems(){
    const ol = document.getElementById('schedules');
    
    //removes all list elements
    while (ol.firstChild){
        ol.removeChild(ol.firstChild);
    }
}

function createScheduleHTML(element){
    const ol = document.getElementById('schedules');
    document.getElementById('schedulestatus').innerText = "";
    
    //this whole part creates the HTML part
    var item = document.createElement("li")

    var schedulename = document.createElement("h2");
    schedulename.textContent = `Schedule: ${element[0]}`;
    item.appendChild(schedulename);

    //itterate through array to create subjectcodes and coursecodes
    for (i=1; i<element.length; i++){
        var subjcode = document.createElement("p")
        subjcode.textContent = `SubjectCode: ${element[i].SubjectCode} CourseCode: ${element[i].CourseCode}`;
        item.appendChild(subjcode);
    }

    ol.appendChild(item);
}

function findCourses (scheduleNamez) {
    fetch (`/timetable/schedule/${scheduleNamez}`)
    .then (res => {
        res.json()
        .then (data => {
            createScheduleHTML(data);
        })
    })
}

function deleteSpecificSchedule(){
    schedulename = document.getElementById('deletebox').value;

    fetch (`/timetable/schedule/${schedulename}`,{
        method: 'DELETE'
    })
    .then (res => {
        if (res.ok) {
            console.log('success');
            document.getElementById('schedulestatus').innerText = `${schedulename} deleted!`;
            displaySchedule()
        }
        else {
            console.log(`Error: ${res.status}`);
            if (res.status == "409") {
                document.getElementById('schedulestatus').innerText = `${schedulename} does not exist!`;
            }
            else if (res.status == "404"){
                document.getElementById('schedulestatus').innerText = `Special characters inputted! NOT ALLOWED!`;
            }
        }
    })

}
