import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-privateschedule',
  templateUrl: './privateschedule.component.html',
  styleUrls: ['./privateschedule.component.css', '../app.component.css']
})
export class PrivatescheduleComponent implements OnInit {

  schedules = [];
  statusMessage = "";
  constructor() { }

  ngOnInit(): void {
  }


  viewPrivateSchedules(){
    //clear array
    this.schedules = [];
    
    //fetch for data
    fetch("http://localhost:3000/privateschedule/view", {
        method: 'GET',
        credentials: "include"
    })
    .then (res => {
      if (res.ok){
        res.json()
        .then (data => {
          this.schedules.push(data);
        })
      }
      else {
        return res.text();
      }
    })
    .then (res => {
      this.statusMessage = res;
    })
    console.log(this.schedules);
  }
}
