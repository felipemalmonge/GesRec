import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IGridComplaintsProps {
  selectedDate: string | null;
  listId: string;
  dateField: string;
  titleField: string;
  spfxContext: WebPartContext;
}
