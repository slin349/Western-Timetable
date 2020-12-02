import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginpageComponent } from './loginpage/loginpage.component';
import { AboutpageComponent } from './aboutpage/aboutpage.component';
import { CoursesComponent } from './courses/courses.component';

const routes: Routes = [
  { path: 'login', component: LoginpageComponent},
  { path : 'about', component: AboutpageComponent},
  { path: 'courses', component: CoursesComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

export const routingComponents = [LoginpageComponent, AboutpageComponent, CoursesComponent];
