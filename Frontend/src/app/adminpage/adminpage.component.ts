import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-adminpage',
  templateUrl: './adminpage.component.html',
  styleUrls: ['./adminpage.component.css', '../app.component.css']
})
export class AdminpageComponent implements OnInit {
  statusMessage = "";
  showAdmin = false;

  constructor() { }

  ngOnInit(): void {
  }

  checkAdmin(){
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
}
