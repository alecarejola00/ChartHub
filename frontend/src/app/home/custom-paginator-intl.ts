import { MatPaginatorIntl } from '@angular/material/paginator';

export class CustomPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Companies per page';

  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return `Page 1 (0 of ${length})`;
    }
    const startIndex = page * pageSize + 1;
    const endIndex = Math.min((page + 1) * pageSize, length);
    const pageNumber = page + 1;

    return `Page ${pageNumber} (${startIndex}-${endIndex})`;
  };
}
