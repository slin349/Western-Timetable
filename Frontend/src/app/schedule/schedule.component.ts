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
  tempschedules = [];

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

  findCourses(schedulename: string){
    this.schedules=[];
    fetch (`http://localhost:3000/timetable/schedule/${schedulename}`)
    .then (res => {
        res.json()
        .then (data => {
          this.schedules.push(data);
        })
    })
  }

  displaySchedule(){
    fetch (`http://localhost:3000/timetable/schedule_all`)
    .then (res => {
        if (res.ok){
            res.json()
            .then (data => {
              this.tempschedules = data;
                data.forEach(element => {
                    this.findCourses(element.ScheduleName);
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
  }

}
