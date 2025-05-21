import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyPlaceholderComponent } from './company-placeholder.component';

describe('CompanyPlaceholderComponent', () => {
  let component: CompanyPlaceholderComponent;
  let fixture: ComponentFixture<CompanyPlaceholderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CompanyPlaceholderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CompanyPlaceholderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
