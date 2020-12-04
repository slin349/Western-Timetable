import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-privateschedule',
  templateUrl: './privateschedule.component.html',
  styleUrls: ['./privateschedule.component.css', '../app.component.css']
})
export class PrivatescheduleComponent implements OnInit {

  schedulename = "";
  scheduleerrorMessage = "";
  deleteschedulename = "";
  schedules = [];
  courseinfo = [];
  show = -1;
  temparray = [];
  description = "";
  visibility = "";
  author = "";
  courseErrorMessage = "";
  errorMessage = ""
  schedule2name = "";
  subject = "";
  coursecode = "";
  displayButton = false;
  deleteMessage = "";
  visibilityschedulename = "";
  visibilityupdate = "";
  visibilityMessage = "";

  constructor() { }

  ngOnInit(): void {
  }

  updateScheduleName(schedname: string){
    this.schedulename = schedname;
  }

  updatedeleteScheduleName(schedname: string){
    this.deleteschedulename = schedname;
  }

  updateDescription(description: string){
    this.description = description;
  }

  updateVisibility(visibility: string) {
    this.visibility = visibility;
  }
  
  updateAuthorName(author: string){
    this.author = author;
  }

  updateSchedule2Name(schedulename: string) {
    this.schedule2name=schedulename;
  }

  updateSubjectName(subject: string){
    this.subject = subject;
  }

  updateCoursecode(coursecode: string){
    this.coursecode = coursecode;
  }

  updatevisibilitySchedulename(visibilityschedulename: string){
    this.visibilityschedulename = visibilityschedulename;
  }

  updatevisibilityValue(value: string){
    this.visibilityupdate = value;
  }

  viewPrivateSchedules(){
    //clears schedules
    this.temparray = [];
    var count = 0;
    fetch (`http://localhost:3000/privateschedule/view`, {
      method: "GET",
      credentials: "include"
    })
    .then (res => {
        if (res.ok){
            res.json()
            .then (data => {
                data.forEach(element => {
                    fetch (`http://localhost:3000/timetable/schedule/${element.ScheduleName}`)
                    .then (res => {
                        res.json()
                        .then (data => {
                          //if visibility is true
                          count ++;

                          //stop after 20 schedules
                          if (count > 20){
                            return;
                          }

                          this.temparray.push(data);          
                          this.temparray.sort((a,b) => {
                          return b[6] - a[6];
                          })
                        })
                    })
                })
            })
        }
        else {
          return res.text()
        }
    })
    .then (res => {
      this.errorMessage = res;
    })

    this.schedules = this.temparray;
  }

  viewCourseInfo(i: number){
    //clear array
    this.courseinfo = [];

    //if no courses
    if (this.schedules[i].length < 8){
      return;
    }

    //if greater 7 means there is courses
    for (var j = 7; j<this.schedules[i].length; j++ ){
      
      const subjectname = this.schedules[i][j].SubjectCode;
      const coursecode = this.schedules[i][j].CourseCode;

      //fetch for data
      fetch(`http://localhost:3000/timetable/${subjectname}/${coursecode}`) //fetch based on subject name and coursecode
      .then (res => res.json())
      .then (data => {
        this.courseinfo.push(data);
      })
    }
    if (this.show === i){
      this.show = -1;
    }
    else {
      this.show = i;
    }
  }

  createSchedule() {
    this.scheduleerrorMessage = "";
    const schedulename = this.schedulename;
    const author = this.author;
    const description = this.description;
    const visibility = this.visibility;

    //if schedule name is left blank
    if (schedulename == ""){
      return this.scheduleerrorMessage = "Schedule name must not be empty"
    }

    //if author is left blank
    if (author == "") {
      return this.scheduleerrorMessage = "Author must not be left blank"
    }

    //if visibility is not selected
    if (visibility == ""){
      return this.scheduleerrorMessage = "Select public or private";
    }

    //if public
    if (visibility == "public"){
      fetch(`http://localhost:3000/timetable/createschedule/${schedulename}/${author}/${description}`, {
        method: "POST",
        credentials: "include"
      })
      .then (res => {
        if (res.ok){
          return res.text();
        }
        else {
          return res.text();
        }
      })
      .then (res => {
        this.scheduleerrorMessage = res;
      })
    }

    //if private
    if (visibility == "private"){
      fetch(`http://localhost:3000/privateschedules/create/${schedulename}/${author}/${description}`, {
        method: "POST",
        credentials: "include"
      })
      .then (res => {
        if (res.ok){
          return res.text();
        }
        else {
          return res.text();
        }
      })
      .then (res => {
        this.scheduleerrorMessage = res;
      })
    }

    //redisplay schedules
    this.viewPrivateSchedules();
  }

  addToSchedule(){
    const schedulename = this.schedule2name;
    const subject = this.subject;
    const coursecode = this.coursecode;

    //cant leave empty spaces
    if (schedulename == ""){
      return this.courseErrorMessage = "Schedule name can not be blank";
    }
    if (subject == ""){
      return this.courseErrorMessage = "Subject can not be blank";
    }
    if (coursecode == ""){
      return this.courseErrorMessage = "Coursecode name can not be blank";
    }

    //fetch for data
    fetch(`http://localhost:3000/timetable/schedule/${schedulename}/${subject}/${coursecode}`, {
      method: "PUT",
      credentials: "include"
    })
    .then (res => {
      if (res.ok){
        return res.text();
      }
      else {
        return res.text();
      }
    })
    .then (res => {
      this.courseErrorMessage = res;
    })

    //redisplay schedule
    this.viewPrivateSchedules();
  }

  toggleButtonDiv(){
    this.displayButton = !this.displayButton;
    this.deleteMessage = "";
  }

  buttonYes(){
    //toggle the div
    this.displayButton = !this.displayButton;
    const schedulename = this.deleteschedulename;

    //if user inputs empty
    if (schedulename == ""){
      return this.deleteMessage= 'Schedule name can not be blank';
    }
    
    //fetch for data
    fetch (`http://localhost:3000/timetable/schedule/${schedulename}`, {
      method: "DELETE",
      credentials: "include"
    })
    .then (res => {
      if (res.ok){
        console.log("hi");
        console.log(res);
        return res.text();
      }
      else {
        console.log("bye");
        console.log(res);
        return res.text();
      }
    })
    .then (res => {
      this.deleteMessage = res;
    })
    //redisplay schedules
    this.viewPrivateSchedules();
  }

  buttonNo(){
    this.displayButton = !this.displayButton;
  }

  changeVisibility(){
    const schedulename = this.visibilityschedulename;
    const visibility = this.visibilityupdate;

    //if schedule name is empty
    if (schedulename == ""){
      return this.visibilityMessage = "Schedule name can not be blank!"
    }

    //check if visibility is selected
    if (visibility == ""){
      return this.visibilityMessage = "Please choose public or private"
    }

    //if public
    if (visibility == "public"){
      fetch(`http://localhost:3000/privateschedule/change/public/${schedulename}`, {
        method: "POST",
        credentials: "include"
      })
      .then (res => {
        if (res.ok){
          return res.text();
        }
        else {
          return res.text();
        }
      })
      .then (res => {
        this.visibilityMessage = res;
      })
    }

    //if private
    if (visibility == "private"){
      fetch(`http://localhost:3000/privateschedule/change/private/${schedulename}`, {
        method: "POST",
        credentials: "include"
      })
      .then (res => {
        if (res.ok){
          return res.text();
        }
        else {
          return res.text();
        }
      })
      .then (res => {
        this.visibilityMessage = res;
      })
    }

    
  }
}
