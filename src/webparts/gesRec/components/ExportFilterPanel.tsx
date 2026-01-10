import * as React from 'react';
import { 
  Panel, 
  PanelType, 
  PrimaryButton, 
  DefaultButton,
  Dropdown,
  IDropdownOption,
  DatePicker,
  DayOfWeek,
  Stack,
  Label,
  Spinner,
  SpinnerSize
} from '@fluentui/react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { ExcelExportService, ExportFilterOptions } from '../services/ExcelExportService';

export interface IExportFilterPanelProps {
  isOpen: boolean;
  onDismiss: () => void;
  spfxContext: WebPartContext;
  complaintsListId?: string;
}

const STATUS_OPTIONS: IDropdownOption[] = [
  { key: 'SUBMITTED', text: 'SUBMITTED' },
  { key: 'PENDING', text: 'PENDING' },
  { key: 'WORK IN PROGRESS', text: 'WORK IN PROGRESS' },
  { key: 'CLOSED', text: 'CLOSED' },
  { key: 'CANCELLED', text: 'CANCELLED' }
];

export const ExportFilterPanel: React.FC<IExportFilterPanelProps> = (props) => {
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleStatusChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption): void => {
    if (option) {
      setSelectedStatuses(prev => {
        if (option.selected) {
          return [...prev, option.key as string];
        } else {
          return prev.filter(key => key !== option.key);
        }
      });
    }
  };

  const handleExport = async (): Promise<void> => {
    // Validate configuration
    const validation = ExcelExportService.validateExportConfig({
      listId: props.complaintsListId,
      spfxContext: props.spfxContext
    });

    if (!validation.isValid) {
      alert(`Cannot export: ${validation.error}`);
      return;
    }

    setIsExporting(true);
    try {
      const filterOptions: ExportFilterOptions = {
        statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        startDate: startDate,
        endDate: endDate
      };

      await ExcelExportService.exportListToExcel({
        listId: props.complaintsListId!,
        spfxContext: props.spfxContext,
        fileName: 'Complaints_Report',
        filters: filterOptions
      });

      alert('Excel file downloaded successfully!');
      props.onDismiss();
    } catch (error) {
      console.error('Export error:', error);
      alert(`Error exporting data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClear = (): void => {
    setSelectedStatuses([]);
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const onRenderFooterContent = (): JSX.Element => {
    return (
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton 
          onClick={handleExport} 
          disabled={isExporting}
          text={isExporting ? 'Exporting...' : 'Download Excel'}
        />
        <DefaultButton 
          onClick={handleClear} 
          disabled={isExporting}
          text="Clear Filters"
        />
        <DefaultButton 
          onClick={props.onDismiss} 
          disabled={isExporting}
          text="Cancel"
        />
      </Stack>
    );
  };

  return (
    <Panel
      isOpen={props.isOpen}
      onDismiss={props.onDismiss}
      type={PanelType.medium}
      headerText="Export Complaints to Excel"
      closeButtonAriaLabel="Close"
      onRenderFooterContent={onRenderFooterContent}
      isFooterAtBottom={true}
    >
      <Stack tokens={{ childrenGap: 20 }}>
        {isExporting && (
          <Stack horizontalAlign="center" tokens={{ childrenGap: 10 }}>
            <Spinner size={SpinnerSize.large} label="Exporting data..." />
          </Stack>
        )}

        <Stack tokens={{ childrenGap: 8 }}>
          <Label>Status Filter (Multi-select)</Label>
          <Dropdown
            placeholder="Select status(es)"
            multiSelect
            options={STATUS_OPTIONS}
            selectedKeys={selectedStatuses}
            onChange={handleStatusChange}
            disabled={isExporting}
          />
          <small style={{ color: '#605e5c' }}>
            Leave empty to include all statuses
          </small>
        </Stack>

        <Stack tokens={{ childrenGap: 8 }}>
          <Label>Answer Limit Date Range</Label>
          <DatePicker
            label="Start Date"
            placeholder="Select start date"
            value={startDate}
            onSelectDate={(date) => setStartDate(date || undefined)}
            formatDate={(date) => date?.toLocaleDateString() || ''}
            firstDayOfWeek={DayOfWeek.Monday}
            disabled={isExporting}
          />
          <DatePicker
            label="End Date"
            placeholder="Select end date"
            value={endDate}
            onSelectDate={(date) => setEndDate(date || undefined)}
            formatDate={(date) => date?.toLocaleDateString() || ''}
            firstDayOfWeek={DayOfWeek.Monday}
            minDate={startDate}
            disabled={isExporting}
          />
          <small style={{ color: '#605e5c' }}>
            Leave empty to include all dates
          </small>
        </Stack>

        <Stack tokens={{ childrenGap: 8 }}>
          <Label>Summary</Label>
          <div style={{ padding: '10px', backgroundColor: '#f3f2f1', borderRadius: '4px' }}>
            {selectedStatuses.length === 0 && !startDate && !endDate ? (
              <p style={{ margin: 0 }}>All complaints will be exported</p>
            ) : (
              <>
                {selectedStatuses.length > 0 && (
                  <p style={{ margin: '5px 0' }}>
                    <strong>Status:</strong> {selectedStatuses.join(', ')}
                  </p>
                )}
                {startDate && (
                  <p style={{ margin: '5px 0' }}>
                    <strong>Start Date:</strong> {startDate.toLocaleDateString()}
                  </p>
                )}
                {endDate && (
                  <p style={{ margin: '5px 0' }}>
                    <strong>End Date:</strong> {endDate.toLocaleDateString()}
                  </p>
                )}
              </>
            )}
          </div>
        </Stack>
      </Stack>
    </Panel>
  );
};
