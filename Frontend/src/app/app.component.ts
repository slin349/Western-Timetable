import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Frontend';

  //logging out user
  logoutFunction(){
    //fetch for backend route
    fetch('http://localhost:3000/users/logout', {
      method: 'POST',
      credentials: "include"
    })
    .then (res => {
      console.log('User logged out');
    })
  }
}
