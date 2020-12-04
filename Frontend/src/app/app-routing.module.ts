import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginpageComponent } from './loginpage/loginpage.component';
import { AboutpageComponent } from './aboutpage/aboutpage.component';
import { CoursesComponent } from './courses/courses.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { PrivatescheduleComponent } from './privateschedule/privateschedule.component';
import { AdminpageComponent } from './adminpage/adminpage.component';

const routes: Routes = [
  { path: 'login', component: LoginpageComponent},
  { path : 'about', component: AboutpageComponent},
  { path: 'courses', component: CoursesComponent},
  { path: 'schedules', component: ScheduleComponent},
  { path: 'privateschedules', component: PrivatescheduleComponent},
  { path: 'admin', component: AdminpageComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

export const routingComponents = [LoginpageComponent, AboutpageComponent, CoursesComponent, ScheduleComponent, PrivatescheduleComponent, AdminpageComponent];
