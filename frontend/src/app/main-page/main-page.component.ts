import { Component } from '@angular/core';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss'
})
export class MainPageComponent {
  isHomePaneVisible = false;

  toggleHomePane() {
    this.isHomePaneVisible = !this.isHomePaneVisible;
  }
  handleCompanySelected() {
    if (window.innerWidth <= 768) {
      this.isHomePaneVisible = false;
    }
  }
}
