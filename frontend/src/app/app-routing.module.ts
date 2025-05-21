import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { CompanyComponent } from './company/company.component';
import { MainPageComponent } from './main-page/main-page.component';
import { CompanyPlaceholderComponent } from './company-placeholder/company-placeholder.component';

const routes: Routes = [
  {
    path: '',
    component: MainPageComponent,
    children: [
      { path: '', component: CompanyPlaceholderComponent }, // Optional
      { path: 'company/:symbol', component: CompanyComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
