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
  temparray = [];
  show = -1;

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


  displaySchedule(){
    var count = 0;
    fetch (`http://localhost:3000/timetable/schedule_all`)
    .then (res => {
        if (res.ok){
            res.json()
            .then (data => {
                data.forEach(element => {
                    count ++;

                    //stop after 10 schedules
                    if (count > 10){
                      return;
                    }
                    fetch (`http://localhost:3000/timetable/schedule/${element.ScheduleName}`)
                    .then (res => {
                        res.json()
                        .then (data => {
                          this.temparray.push(data);          
                          this.temparray.sort((a,b) => {
                            return b[3] - a[3];
                          })
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
    
    if (this.show === i){
      this.show = -1;
    }
    else {
      this.show = i;
    }

    //clear array
    this.courseinfo = [];

    //if greater 4 means there is courses
    if (this.schedules[i].length > 4){
      for (var j = 4; j<this.schedules[i].length; j++ ){
        const subjectname = this.schedules[i][j].SubjectCode;
        const coursecode = this.schedules[i][j].CourseCode;

        //fetch for data
        fetch(`http://localhost:3000/timetable/${subjectname}/${coursecode}`) //fetch based on subject name and coursecode
        .then (res => res.json())
        .then (data => {
          this.courseinfo.push(data);
        })

      }
    }
    else {
      return;
    }
  }
  
}
