import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-privateschedule',
  templateUrl: './privateschedule.component.html',
  styleUrls: ['./privateschedule.component.css', '../app.component.css']
})
export class PrivatescheduleComponent implements OnInit {

  schedulename = "";
  errorMessage = "";
  deleteschedulename = "";
  schedules = [];
  courseinfo = [];
  show = -1;
  temparray = [];

  constructor() { }

  ngOnInit(): void {
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
  
}
