import { WebPartContext } from '@microsoft/sp-webpart-base';
import { spfi, SPFI, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/fields';
import * as XLSX from 'xlsx';

export interface ExportFilterOptions {
  statuses?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface ExportOptions {
  listId: string;
  spfxContext: WebPartContext;
  fileName?: string;
  filters?: ExportFilterOptions;
}

/**
 * Service for exporting SharePoint list data to Excel
 */
export class ExcelExportService {
  // Whitelist of columns to export (by display name)
  private static readonly EXPORT_COLUMNS = [
    'ID_val',
    'Title',
    'Assigned To',
    'Date of Complaint Reception',
    'Answer Limit date',
    'Answer Limit Date Extension',
    'NIF',
    'Sub Type',
    'STATUS',
    'CLOSED DATE',
    'GROUNDED',
    'Area',
    'PORTFOLIO',
    'COMPLAINANT TYPE',
    'BORROWER NAME',
    'LOAN ID',
    'COMPLAINANT NAME',
    'SUBMISSION FORM',
    'COMPLAINED ENTITY',
    'PERFORMING TYPE',
    'LegalProcess',
    'LegalProcessNumber',
    'RAS',
    'Debt Type',
    'COMPLAINANT EMAIL',
    'PROJECT NAME',
    'SERVICING CUSTOMER',
    'INVESTOR',
    'DESCRIPTION',
    'Level1',
    'Level2',
    'Level3',
    'ANSWER SUMMARY',
    'Comments',
    'PRIORITY',
    'Severity',
    'Company',
    'NIF COMPLAINANT',
    'Lawyer Name',
    'Lawyer Email',
    'External Reference Number'
  ];

  private static readonly COLUMN_ALIASES: Record<string, string[]> = {
    'Assigned To': ['Assigned To', 'AssignedTo']
  };

  private static readonly DATE_ONLY_COLUMNS = new Set([
    'Date of Complaint Reception',
    'Answer Limit date',
    'Answer Limit Date Extension',
    'CLOSED DATE'
  ]);

  private static parseDateValue(value: any): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  // Export all data from a SharePoint list to Excel file
   
  public static async exportListToExcel(options: ExportOptions): Promise<void> {
    const { listId, spfxContext, fileName = 'Complaints_Export', filters } = options;

    if (!listId) {
      throw new Error('List ID is required for export');
    }

    try {
      const sp: SPFI = spfi().using(SPFx(spfxContext));
      
      console.log('Fetching data from SharePoint list:', listId);
      console.log('Filters:', filters);
      
      const list = sp.web.lists.getById(listId);
      
      const allFields = await list.fields
        .filter("Hidden eq false and ReadOnlyField eq false")
        .select("InternalName", "Title", "TypeAsString")();
      
      console.log('All fields:', allFields);
      
      const fieldByTitle = new Map(allFields.map(f => [f.Title.toLowerCase(), f]));
      const fieldByInternal = new Map(allFields.map(f => [f.InternalName.toLowerCase(), f]));

      const resolveField = (columnName: string) => {
        const aliases = this.COLUMN_ALIASES[columnName] || [columnName];

        for (const alias of aliases) {
          const normalized = alias.toLowerCase();
          const byTitle = fieldByTitle.get(normalized);
          if (byTitle) {
            return byTitle;
          }

          const byInternal = fieldByInternal.get(normalized);
          if (byInternal) {
            return byInternal;
          }
        }

        return undefined;
      };
      
      // Build export fields in the order specified in EXPORT_COLUMNS
      const exportFields = this.EXPORT_COLUMNS
        .map(columnName => {
          const field = resolveField(columnName);
          if (!field) {
            return undefined;
          }

          return {
            ...field,
            ExportTitle: columnName
          };
        })
        .filter(field => 
          field && 
          field.TypeAsString !== 'Lookup' && 
          field.TypeAsString !== 'LookupMulti'
        ) as Array<{ InternalName: string; Title: string; TypeAsString: string; ExportTitle: string }>;
      
      console.log('Fields to export (in order):', exportFields.map(f => f.ExportTitle));
      
      const filterParts: string[] = [];
      
      if (filters?.statuses && filters.statuses.length > 0) {
        const statusFilters = filters.statuses.map(status => 
          `STATUS_ eq '${status}'`
        ).join(' or ');
        filterParts.push(`(${statusFilters})`);
      }

      if (filters?.startDate || filters?.endDate) {
        if (filters.startDate) {
          const startDateISO = filters.startDate.toISOString();
          filterParts.push(`Answer_x0020_Limit_x0020_date ge datetime'${startDateISO}'`);
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          const endDateISO = endDate.toISOString();
          filterParts.push(`Answer_x0020_Limit_x0020_date le datetime'${endDateISO}'`);
        }
      }
      
      const filterQuery = filterParts.length > 0 ? filterParts.join(' and ') : '';
      console.log('Filter query:', filterQuery);

      const selectFields = exportFields.reduce((acc: string[], field) => {
        acc.push(field.InternalName);
        if (field.TypeAsString === 'User' || field.TypeAsString === 'UserMulti') {
          acc.push(`${field.InternalName}/Title`);
        }
        return acc;
      }, []);

      const expandFields = exportFields
        .filter(field => field.TypeAsString === 'User' || field.TypeAsString === 'UserMulti')
        .map(field => field.InternalName);
      
      let query = list.items.top(5000).select(...selectFields).orderBy('ID', false);

      if (expandFields.length > 0) {
        query = query.expand(...expandFields);
      }
      
      if (filterQuery) {
        query = query.filter(filterQuery);
      }
      
      const items = await query();

      console.log(`Fetched ${items.length} items from SharePoint`);

      if (items.length === 0) {
        alert('No data available to export.');
        return;
      }

      // Prepare data for Excel
      const exportData = items.map(item => {
        const row: any = {};
        exportFields.forEach(field => {
          const value = item[field.InternalName];

          if (field.TypeAsString === 'User' && value) {
            row[field.ExportTitle] = value.Title || '';
            return;
          }

          if (field.TypeAsString === 'UserMulti' && Array.isArray(value)) {
            row[field.ExportTitle] = value.map((user: any) => user?.Title).filter(Boolean).join('; ');
            return;
          }

          if (this.DATE_ONLY_COLUMNS.has(field.ExportTitle) && value) {
            const dateValue = this.parseDateValue(value);
            row[field.ExportTitle] = dateValue || value;
            return;
          }
          
          if (field.TypeAsString === 'DateTime' && value) {
            try {
              const date = new Date(value);
              row[field.ExportTitle] = date.toLocaleString();
            } catch {
              row[field.ExportTitle] = value;
            }
          } else {
            row[field.ExportTitle] = value || '';
          }
        });
        return row;
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData, { cellDates: true });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Complaints');

      // Force date format for configured date-only columns so Excel sorts as dates
      const dateColumnIndexes = exportFields
        .map((field, index) => this.DATE_ONLY_COLUMNS.has(field.ExportTitle) ? index : -1)
        .filter(index => index >= 0);

      for (let rowIndex = 1; rowIndex <= exportData.length; rowIndex++) {
        dateColumnIndexes.forEach(colIndex => {
          const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
          const cell = worksheet[cellAddress];
          if (cell && (cell.t === 'd' || cell.t === 'n')) {
            cell.z = 'dd/mm/yyyy';
          }
        });
      }

      const maxWidth = 50;
      const columnWidths = exportFields.map(field => ({
        wch: Math.min(maxWidth, Math.max(field.ExportTitle.length, 10))
      }));
      worksheet['!cols'] = columnWidths;

      // Enable filter dropdowns on the header row when opening Excel
      const endCol = XLSX.utils.encode_col(Math.max(exportFields.length - 1, 0));
      const endRow = exportData.length + 1; // +1 because header is row 1
      worksheet['!autofilter'] = { ref: `A1:${endCol}${endRow}` };

      const now = new Date();
      const datePart = now.toISOString().split('T')[0];
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const fullFileName = `${fileName}_${datePart}_${hh}${mm}${ss}.xlsx`;
      
      XLSX.writeFile(workbook, fullFileName);
      
      console.log('Excel file downloaded successfully:', fullFileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  //Validate export configuration

  public static validateExportConfig(options: Partial<ExportOptions>): { isValid: boolean; error?: string } {
    if (!options.listId) {
      return { isValid: false, error: 'List ID is not configured. Please configure the web part properties.' };
    }
    
    if (!options.spfxContext) {
      return { isValid: false, error: 'SharePoint context is not available.' };
    }

    return { isValid: true };
  }
}
