import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-loginpage',
  templateUrl: './loginpage.component.html',
  styleUrls: ['../app.component.css']
})
export class LoginpageComponent implements OnInit {

  loginemail = "";
  loginpassword = "";
  regemail = "";
  regusername = "";
  regpassword = "";
  statusMessage= "";
  statusloginMessage= "";
  link = "";
  changepassword = "";
  changeMessage = "";
  constructor() { }

  ngOnInit(): void {
  }

  updateregEmail(email: string){
    this.regemail = email;
  }

  updateregUsername(username: string){
    this.regusername = username;
  }

  updateregPassword(password: string){
    this.regpassword = password;
  }

  updateloginEmail(email: string){
    this.loginemail = email;
  }

  updateloginPassword(password: string){
    this.loginpassword = password;
  }

  updatechangePassword(password: string){
    this.changepassword = password;
  }

  registerAccount(){
    
    const userdata = { email: this.regemail, username: this.regusername, password: this.regpassword};

    //fetch to add user to database
    fetch('/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userdata),
    })
    .then(async res => {
      if (res.ok){
        return res.text();
      }
      else {
        const msg = await res.text();
        throw new Error(msg);
      }
    })
    .then(res => {
      //on succesful login
      this.statusMessage = 'Sucessful Registration';
      this.link = res;
    })
    .catch(err => {
      //on failure login
      this.statusMessage = err;
    }) 
  }

  loginAccount(){
    const userdata = { email: this.loginemail, password: this.loginpassword};

    //fetch to login to database
    //credentials: include would be used to verify and send cookies
    fetch('/users/login', {
      method: 'POST',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userdata),
    })
    .then(res => {
      if (res.ok){
        return this.statusloginMessage = 'Sucessfully logged in!';
      }
      else {
        return res.text();
      }
    })
    .then (res => {
      this.statusloginMessage = res;
    })
  }

  reVerify(){
    const email = this.loginemail;
    fetch (`/users/reverify/${email}`)
    .then(res => {
      return res.text();
    })
    .then (res => {
      this.statusloginMessage = 'Email re-verified, click on verify'
      this.link = res;
    })
  }
  
  updatePassword(){
    const newPass = this.changepassword;

    //if left blank
    if (newPass == ""){
      return this.changeMessage = 'Password cannot be blank';
    }
    
    //fetch for update password
    fetch(`/changepassword/${newPass}`, {
      method: 'POST',
      credentials: "include",
    })
    .then(res => {
      if (res.ok){
        return this.changeMessage = 'Sucessfully changed password!';
      }
      else {
        return res.text();
      }
    })
    .then (res => {
      this.changeMessage = res;
    })
  }
}
