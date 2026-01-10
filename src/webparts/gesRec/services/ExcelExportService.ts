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
    'Answer Limit date',
    'Answer Limit Date Extension',
    'NIF',
    'GROUNDED',
    'Date of Complaint Reception',
    'Area',
    'Sub Type',
    'PORTFOLIO',
    'COMPLAINANT TYPE',
    'BORROWER NAME',
    'LOAN ID',
    'COMPLAINANT NAME',
    'SUBMISSION FORM',
    'COMPLAINED ENTITY',
    'PERFORMING TYPE',
    'CLOSED DATE',
    'STATUS',
    'Closed by',
    'LegalProcess',
    'LegalProcessNumber',
    'RAS',
    'Debt Type',
    'COMPLAINANT EMAIL',
    'PROJECT NAME',
    'SERVICING CUSTOMER',
    'INVESTOR',
    'DATE OF COMPLAINT INSTRUCTION',
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

  /**
   * Export all data from a SharePoint list to Excel file
   */
  public static async exportListToExcel(options: ExportOptions): Promise<void> {
    const { listId, spfxContext, fileName = 'Complaints_Export', filters } = options;

    if (!listId) {
      throw new Error('List ID is required for export');
    }

    try {
      // Initialize PnP with SPFx context
      const sp: SPFI = spfi().using(SPFx(spfxContext));
      
      // Fetch all items from the list
      console.log('Fetching data from SharePoint list:', listId);
      console.log('Filters:', filters);
      
      const list = sp.web.lists.getById(listId);
      
      // Get list fields to determine what to export
      const allFields = await list.fields
        .filter("Hidden eq false and ReadOnlyField eq false")
        .select("InternalName", "Title", "TypeAsString")();
      
      console.log('All fields:', allFields);
      
      // Create a map for quick field lookup
      const fieldMap = new Map(allFields.map(f => [f.Title, f]));
      
      // Build export fields in the order specified in EXPORT_COLUMNS
      const exportFields = this.EXPORT_COLUMNS
        .map(columnName => fieldMap.get(columnName))
        .filter(field => 
          field && 
          // Exclude complex fields
          field.TypeAsString !== 'User' && 
          field.TypeAsString !== 'UserMulti' && 
          field.TypeAsString !== 'Lookup' && 
          field.TypeAsString !== 'LookupMulti'
        ) as Array<{ InternalName: string; Title: string; TypeAsString: string }>;
      
      console.log('Fields to export (in order):', exportFields.map(f => f.Title));
      
      // Build filter query
      const filterParts: string[] = [];
      
      // Add status filter if provided
      if (filters?.statuses && filters.statuses.length > 0) {
        const statusFilters = filters.statuses.map(status => 
          `STATUS_ eq '${status}'`
        ).join(' or ');
        filterParts.push(`(${statusFilters})`);
      }
      
      // Add date range filter if provided
      if (filters?.startDate || filters?.endDate) {
        if (filters.startDate) {
          const startDateISO = filters.startDate.toISOString();
          filterParts.push(`Answer_x0020_Limit_x0020_date ge datetime'${startDateISO}'`);
        }
        if (filters.endDate) {
          // Set end date to end of day
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          const endDateISO = endDate.toISOString();
          filterParts.push(`Answer_x0020_Limit_x0020_date le datetime'${endDateISO}'`);
        }
      }
      
      const filterQuery = filterParts.length > 0 ? filterParts.join(' and ') : '';
      console.log('Filter query:', filterQuery);
      
      // Get all items with export fields only
      let query = list.items.top(5000).select(...exportFields.map(f => f.InternalName));
      
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
          
          // Format dates nicely
          if (field.TypeAsString === 'DateTime' && value) {
            try {
              const date = new Date(value);
              row[field.Title] = date.toLocaleString();
            } catch {
              row[field.Title] = value;
            }
          } else {
            row[field.Title] = value || '';
          }
        });
        return row;
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Complaints');

      // Auto-size columns
      const maxWidth = 50;
      const columnWidths = exportFields.map(field => ({
        wch: Math.min(maxWidth, Math.max(field.Title.length, 10))
      }));
      worksheet['!cols'] = columnWidths;

      // Generate Excel file and trigger download
      const timestamp = new Date().toISOString().split('T')[0];
      const fullFileName = `${fileName}_${timestamp}.xlsx`;
      
      XLSX.writeFile(workbook, fullFileName);
      
      console.log('Excel file downloaded successfully:', fullFileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  /**
   * Validate export configuration
   */
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
