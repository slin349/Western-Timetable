import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-adminpage',
  templateUrl: './adminpage.component.html',
  styleUrls: ['./adminpage.component.css', '../app.component.css']
})
export class AdminpageComponent implements OnInit {
  statusMessage = "";
  showAdmin = false;
  users = [];

  constructor() { }

  ngOnInit(): void {
  }

  checkAdmin(){
    //fetch to see if admin
    fetch('http://localhost:3000/admin/auth', {
      method: "GET",
      credentials: "include"
    })
    .then (res => {
      if (res.ok){
        this.showAdmin = true;
        return res.text();
      }
      else {
        return res.text();
      }
    })
    .then (res => {
      this.statusMessage = res;
    })
  }

  viewUsers(){
    var temparray = [];

    //fetch
    fetch('http://localhost:3000/admin/allusers', {
      method: "GET",
      credentials: "include"
    })
    .then (res => {
      if (res.ok){
        res.json()
        .then (data => {
          temparray.push(data);
        })
      }
      else {
        return res.text()
      }
    })
    .then (res => {
      this.statusMessage = res;
    })

    this.users = temparray;
  }
}
