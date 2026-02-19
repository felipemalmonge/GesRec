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
    'GROUNDED',
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

  private static formatDateDDMMYYYY(value: any): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

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
      
      // Create maps for quick field lookup by title or internal name
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
          // Exclude complex fields
          field.TypeAsString !== 'Lookup' && 
          field.TypeAsString !== 'LookupMulti'
        ) as Array<{ InternalName: string; Title: string; TypeAsString: string; ExportTitle: string }>;
      
      console.log('Fields to export (in order):', exportFields.map(f => f.ExportTitle));
      
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

      // Build select and expand for Person/Group fields
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
      
      // Get all items with export fields only
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

          // Format person/group fields as display names
          if (field.TypeAsString === 'User' && value) {
            row[field.ExportTitle] = value.Title || '';
            return;
          }

          if (field.TypeAsString === 'UserMulti' && Array.isArray(value)) {
            row[field.ExportTitle] = value.map((user: any) => user?.Title).filter(Boolean).join('; ');
            return;
          }

          if (this.DATE_ONLY_COLUMNS.has(field.ExportTitle) && value) {
            row[field.ExportTitle] = this.formatDateDDMMYYYY(value);
            return;
          }
          
          // Format dates nicely
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
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Complaints');

      // Auto-size columns
      const maxWidth = 50;
      const columnWidths = exportFields.map(field => ({
        wch: Math.min(maxWidth, Math.max(field.ExportTitle.length, 10))
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
