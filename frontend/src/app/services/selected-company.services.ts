import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SelectedCompanyService {
  private selectedSymbol = new BehaviorSubject<string | null>(null);
  selectedSymbol$ = this.selectedSymbol.asObservable();

  setSelectedSymbol(symbol: string) {
    this.selectedSymbol.next(symbol);
  }
}
