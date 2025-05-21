import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HttpClientModule } from '@angular/common/http';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CustomPaginatorIntl } from './home/custom-paginator-intl';

import { AppComponent } from './app.component';
import { CompanyComponent } from './company/company.component';
import { HeaderComponent } from './header/header.component';
import { DataService } from './services/data.service';
import { HomeComponent } from './home/home.component';
import { MainPageComponent } from './main-page/main-page.component';
import { CompanyPlaceholderComponent } from './company-placeholder/company-placeholder.component';

@NgModule({
  declarations: [
    AppComponent,
    CompanyComponent,
    HeaderComponent,
    HomeComponent,
    MainPageComponent,
    CompanyPlaceholderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatToolbarModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    HttpClientModule,
    MatPaginatorModule,
    MatCardModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  providers: [
    provideAnimationsAsync(),
    DataService,
    {provide: MatPaginatorIntl, useClass: CustomPaginatorIntl}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
