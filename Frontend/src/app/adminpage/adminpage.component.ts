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
  grantAdminEmail = "";
  enabledOrdisabled = "";
  errorMessage = "";

  constructor() { }

  ngOnInit(): void {
  }

  updateEmail(email: string){
    this.grantAdminEmail = email;
  }

  updateAction(value: string){
    this.enabledOrdisabled = value;
  }

  checkAdmin(){
    //fetch to see if admin
    fetch('/admin/auth', {
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
    this.users = [];
    var temparray = [];
    //fetch
    fetch('/admin/allusers', {
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

  giveAdmin(){
    const useremail = this.grantAdminEmail;

    //if input is empty
    if (useremail == ""){
      return this.errorMessage = "Must enter user's email"
    }

    fetch(`/admin/grant/access/${useremail}`, {
      method: "PUT",
      credentials: "include"
    })
    .then (res => {
      if (res.ok){
        return res.text()
      }
      else {
        return res.text()
      }
    })
    .then (res => {
      this.errorMessage = res;
    })

    //refresh
    this.viewUsers();
  }

  modifyUser(){
    const useremail = this.grantAdminEmail;
    const enabledOrdisabled = this.enabledOrdisabled;

    //if input is empty
    if (useremail == ""){
      return this.errorMessage = "Must enter user's email"
    }

    //make sure they select
    if (enabledOrdisabled == ""){
      return this.errorMessage = "Must select enable or disable"
    }

    //fetch for enabling
    if (enabledOrdisabled == "enable"){
      fetch(`/admin/enable/${useremail}`, {
        method: "POST",
        credentials: "include"
      })
      .then (res => {
        if (res.ok){
          return res.text()
        }
        else {
          return res.text()
        }
      })
      .then (res => {
        this.errorMessage = res;
      })

      //refresh
      this.viewUsers();
    }

    //fetch for disabling
    if (enabledOrdisabled == "disable"){
      fetch(`/admin/disable/${useremail}`, {
        method: "POST",
        credentials: "include"
      })
      .then (res => {
        if (res.ok){
          return res.text()
        }
        else {
          return res.text()
        }
      })
      .then (res => {
        this.errorMessage = res;
      })

      //refresh
      this.viewUsers();
    }
  }
}
