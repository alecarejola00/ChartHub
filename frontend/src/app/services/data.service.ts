import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Papa } from 'ngx-papaparse';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = '${environment.apiUrl}/files';
  private csvPath = 'assets/companyList.csv';

  constructor(private http: HttpClient, private papa: Papa) {}

  // Fetch company data from your backend or a local file
  getCompanies(): Observable<{ symbol: string; name: string }[]> {
    return this.http.get<{ symbol: string; name: string }[]>(this.apiUrl);
  }

  getCompaniesFromCSV(): Observable<{ symbol: string; name: string; desc: string }[]> {
    return this.http.get(this.csvPath, { responseType: 'text' }).pipe(
      map((data: string) => {
        // Use Papa service to parse CSV
        const parsed = this.papa.parse(data, {
          skipEmptyLines: true,
        });
        console.log('Parsed CSV data:', parsed.data);

        // Transform the parsed data and define the type of 'row' as string[]
        return parsed.data
          .filter((row: string[]) => row.length >= 1)  // Explicitly typing 'row' as string[]
          .map((row: string[]) => ({  // Explicitly typing 'row' as string[]
            symbol: row[0],
            name: row[1],
            desc: row[2]
          }));
      })
    );
  }
  getCompanyBySymbol(symbol: string): Observable<{ symbol: string; name: string } | undefined> {
    return this.http.get('assets/companyList.csv', { responseType: 'text' }).pipe(
      map(csvData => {
        const parsed = this.papa.parse(csvData, { skipEmptyLines: true });
        const data = parsed.data as string[][];
        const matchingRow = data.find(row => row[0] === symbol);
        return matchingRow ? { symbol: matchingRow[0], name: matchingRow[1] } : undefined;
      })
    );
}
  addData(name: string): Observable<any> {
    return this.http.post(this.apiUrl, { name });
  }
  getStockData(symbol: string): Observable<any> {
    return this.http.get<any[]>(`${environment.apiUrl}/files/${symbol}`);
  }
  getAllCompanies(): Observable<{ symbol: string; name: string; desc: string }[]> {
    return this.http.get('assets/companyList.csv', { responseType: 'text' }).pipe(
      map(csvData => {
        const parsed = this.papa.parse(csvData, { skipEmptyLines: true });
        const data = parsed.data as string[][];
        return data.map(row => ({
          symbol: row[0],
          name: row[1],
          desc: row[2] || ''
        }));
      })
    );
  }

}
