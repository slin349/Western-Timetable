import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css', '../app.component.css']
})
export class ScheduleComponent implements OnInit {
  schedulename = "";
  errorMessage = "";
  deleteschedulename = "";
  schedules = [];
  courseinfo = [];
  show = -1;
  temparray = [];

  constructor() { }

  ngOnInit(): void {
    this.displaySchedule();
  }

  updateScheduleName(schedname: string){
    this.schedulename = schedname;
  }

  updatedeleteScheduleName(schedname: string){
    this.deleteschedulename = schedname;
  }

  createSchedule(){
    fetch (`http://localhost:3000/timetable/schedule/${this.schedulename}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    })
    .then (res => {
        if (res.ok){
            this.errorMessage =`Schedule: ${this.schedulename} has been added!`;
            this.displaySchedule();
        }
        else {
            console.log(`Error: ${res.status}`);
            if (res.status == 409) {
                this.errorMessage=`Schedule: ${this.schedulename} exists!`;
            }
            else if (res.status == 404) {
              this.errorMessage=`Special characters are not allowed as inputs!`;
            }
        }
    })
  }

  //display schedule for public only
  displaySchedule(){
    var count = 0;
    fetch (`http://localhost:3000/timetable/schedule_all`)
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
                          if (data[4] == true){
                            count ++;
                            //stop after 10 schedules
                            if (count > 10){
                              return;
                            }

                            this.temparray.push(data);          
                            this.temparray.sort((a,b) => {
                            return b[6] - a[6];
                            })
                          }
                        })
                    })
                })
            })
        }
        else {
            console.log(`Error: ${res.status}`);
            if (res.status == 404) {
                this.errorMessage=`There are no schedules`;
                this.schedules=[];
            }
        }
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

}
