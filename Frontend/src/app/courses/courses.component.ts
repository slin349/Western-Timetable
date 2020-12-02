import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css', '../app.component.css']
})
export class CoursesComponent implements OnInit {

  subjects = [];
  coursecodes = [];
  courseinfo = [];
  subjectname = "";
  coursecode = "";
  componentname = "ALL";
  errorMessage = "";
  schedulename = "";
  subjectname2 = "";
  coursecode2 = "";
  classname = "";
  show = false;
  
  constructor() { }

  ngOnInit(): void { //ngOnInit initiates the moment component loads
    fetch("http://localhost:3000/timetable")
    .then(res => res.json())
    //this part basically achieves the GET on /timetable which gives us all our subjects with course descriptions
    .then(data => {
      this.subjects = data;
    })
    this.returnCourseCode('ACTURSCI');
  }

  returnCourseCode(subject : string ){
    this.subjectname=subject;
    fetch(`http://localhost:3000/timetable/${subject}`)
    .then(res => res.json())

    .then (data => {
      this.coursecodes = data;
      this.coursecode = data[0].Coursecode;
    })
  }

  updateCourseCode(coursecode: string){
    this.coursecode = coursecode;
  }

  updateComponent(component: string){
    this.componentname = component;
  }

  updateScheduleName(schedulename: string){
    this.schedulename = schedulename;
  }

  updateSubjectName(subjectname: string){
    this.subjectname2 = subjectname;
  }
  
  updateCourseCode2(coursecode: string){
    this.coursecode2 = coursecode;
  }

  returnCourseInfo(){
    //for case they want all
    if (this.componentname == "ALL"){
      fetch(`http://localhost:3000/timetable/${this.subjectname}/${this.coursecode}`) //fetch based on subject name and coursecode
      .then (res => res.json())
      .then (data => {
        console.log(data);
        this.courseinfo = data;
      })
    }
    else {
      fetch(`http://localhost:3000/timetable/${this.subjectname}/${this.coursecode}/${this.componentname}`)
      .then(res => {
          if (res.ok) {
              res.json()
              .then(data => {
                this.courseinfo = data;
              })
          }
          else {
              this.errorMessage = `${this.subjectname} ${this.coursecode} ${this.componentname} does not exist`;
              console.log(`Error: ${res.status}`);
          }
      })
  }
  }

  addToSchedule(){
    console.log(`${this.schedulename} ${this.subjectname2} ${this.coursecode2}`)
    fetch (`http://localhost:3000/timetable/schedule/${this.schedulename}/${this.subjectname2}/${this.coursecode2}`,{
        method: 'PUT'
    })
    .then (res => {
        if (res.ok){
            this.errorMessage=`Subject ${this.subjectname2} and Course ${this.coursecode2} added to ${this.schedulename}`;
        }
        else {
            
            if (res.status == 409){
              this.errorMessage=`Schedule: ${this.schedulename} does not exist!`;
            }
            else if (res.status == 404){
              this.errorMessage=`Schedule Name not allowed OR Missing Parameters`;
            }
            else if (res.status == 405){
              this.errorMessage=`Subject: ${this.subjectname2} does not exist!`;
            }
            else if (res.status == 408){
              this.errorMessage=`Course: ${this.coursecode2} does not exist!`;
            }
            
            
        }
    })
  }

  togglediv(){
    this.show = !this.show;
  }
}
