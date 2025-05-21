import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Papa } from 'ngx-papaparse';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  companies: { symbol: string; name: string }[] = [];
  isSearchOpen: boolean = false;
  searchQuery: string = '';
  filteredCompaniesList: { symbol: string; name: string }[] = [];

  constructor(private http: HttpClient, private papa: Papa) {}

  ngOnInit(): void {
    this.http.get('assets/company.csv', { responseType: 'text' }).subscribe((data: string) => {
      const parsed = this.papa.parse(data, { skipEmptyLines: true }); // Use Papa to parse the CSV
      this.companies = parsed.data
        .filter((row: string[]) => row.length >= 1)
        .map((row: string[]) => ({
          symbol: row[0],
          name: row[1]
        }));
        this.filterCompanies();
    });
  }

  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;
    this.searchQuery = ''; // Clear search when toggled
    this.filterCompanies();
  }

  filterCompanies(): void {
    if (!this.searchQuery.trim()) {
      this.filteredCompaniesList = this.companies.slice(0, 4);  // Limit to 4 companies when no search
    } else {
      const lower = this.searchQuery.toLowerCase();
      this.filteredCompaniesList = this.companies.filter(c =>
        c.name.toLowerCase().includes(lower) || c.symbol.toLowerCase().includes(lower)
      ).slice(0, 4);  // Limit to 4 filtered results
    }
  }
}
