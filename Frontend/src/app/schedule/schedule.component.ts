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
  show = false;
  courseinfo = [];
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
                            return b[2] - a[2];
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

  viewCourseInfo(value: any){

    //toggles div
    this.show = !this.show;
    
    const temporaryArray = [];

    fetch (`http://localhost:3000/timetable/schedule/${value}`)
    .then (res => {
        res.json()
        .then (data => {
          temporaryArray.push(data);
        })
    })
  }

}
