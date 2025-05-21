import { Component, OnInit, ViewChild } from '@angular/core';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { DataService } from '../services/data.service';
import { SelectedCompanyService } from '../services/selected-company.services';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  @ViewChild('auto') auto!: MatAutocomplete;

  companies: any[] = [];
  pagedCompanies: any[] = [];
  pageSize = 10;
  currentPage = 0;
  searchQuery = '';
  loading = true;
  selectedCompanySymbol: string | null = null;

  constructor(
    private dataService: DataService,
    private selectedCompanyService: SelectedCompanyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.loading = true;
    this.dataService.getAllCompanies().subscribe({
      next: (data) => {
        this.companies = data;
        this.resetPagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load companies', err);
        this.loading = false;
      },
    });
  }

  filteredCompanies(): any[] {
    if (!this.searchQuery) {
      return this.companies;
    }
    const query = this.searchQuery.toLowerCase();
    return this.companies.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.symbol.toLowerCase().includes(query) ||
        (c.desc && c.desc.toLowerCase().includes(query))
    );
  }

  resetPagination(): void {
    this.currentPage = 0;
    this.updatePagedCompanies();
  }

  updatePagedCompanies(): void {
    const filtered = this.filteredCompanies();
    const start = this.currentPage * this.pageSize;
    this.pagedCompanies = filtered.slice(start, start + this.pageSize);
  }

  onPageChange(event: any): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.updatePagedCompanies();
  }

  // Call this method on search input change event
  onSearchChange(): void {
    this.resetPagination(); // Reset to page 0 and update pagedCompanies
  }

  selectCompany(symbol: string): void {
    this.selectedCompanySymbol = symbol;

    // Optional delay to show the highlight effect
    setTimeout(() => {
      this.selectedCompanyService.setSelectedSymbol(symbol);
      this.router.navigate(['/company', symbol]);
    }, 200); // 200ms delay
  }

  get totalPages(): number {
  return Math.ceil(this.filteredCompanies().length / this.pageSize);
  }

// Return an array of page numbers [1, 2, 3, ...]
  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    this.currentPage = page - 1; // zero-based internally
    this.updatePagedCompanies();
  }
  getPagedPageNumbers(): (number | string)[] {
  const total = this.totalPages;
  const current = this.currentPage + 1; // 1-based for UI
  const delta = 2; // pages to show around current page

  const range = [];
  const rangeWithDots: (number | string)[] = [];
  let l: number | undefined;

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 || // always show first
      i === total || // always show last
      (i >= current - delta && i <= current + delta) // range around current
    ) {
      range.push(i);
    }
  }

  for (const i of range) {
    if (l !== undefined) {
      if (i - (l as number) === 2) {
        rangeWithDots.push(l! + 1);
      } else if (i - (l as number) > 2) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
}
}
