import { WebPartContext } from '@microsoft/sp-webpart-base';
import { spfi, SPFI, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/fields';
import * as XLSX from 'xlsx';

export interface ExportOptions {
  listId: string;
  spfxContext: WebPartContext;
  fileName?: string;
}

/**
 * Service for exporting SharePoint list data to Excel
 */
export class ExcelExportService {
  /**
   * Export all data from a SharePoint list to Excel file
   */
  public static async exportListToExcel(options: ExportOptions): Promise<void> {
    const { listId, spfxContext, fileName = 'Complaints_Export' } = options;

    if (!listId) {
      throw new Error('List ID is required for export');
    }

    try {
      // Initialize PnP with SPFx context
      const sp: SPFI = spfi().using(SPFx(spfxContext));
      
      // Fetch all items from the list
      console.log('Fetching data from SharePoint list:', listId);
      const list = sp.web.lists.getById(listId);
      
      // Get list fields to determine what to export
      const allFields = await list.fields
        .filter("Hidden eq false and ReadOnlyField eq false")
        .select("InternalName", "Title", "TypeAsString")();
      
      console.log('All fields:', allFields);
      
      // Filter out complex fields that require expansion (Person, Lookup, etc.)
      const simpleFields = allFields.filter(f => 
        f.TypeAsString !== 'User' && 
        f.TypeAsString !== 'UserMulti' && 
        f.TypeAsString !== 'Lookup' && 
        f.TypeAsString !== 'LookupMulti'
      );
      
      console.log('Simple fields to export:', simpleFields.map(f => f.InternalName));
      
      // Get all items with simple fields only
      const items = await list.items
        .top(5000)
        .select(...simpleFields.map(f => f.InternalName))();

      console.log(`Fetched ${items.length} items from SharePoint`);

      if (items.length === 0) {
        alert('No data available to export.');
        return;
      }

      // Prepare data for Excel
      const exportData = items.map(item => {
        const row: any = {};
        simpleFields.forEach(field => {
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
      const columnWidths = simpleFields.map(field => ({
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
