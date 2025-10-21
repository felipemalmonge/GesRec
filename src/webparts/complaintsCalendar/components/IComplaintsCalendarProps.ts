import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IComplaintsCalendarProps {
  description: string;
  listId: string;
  dateField: string;
  titleField: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  spfxContext: WebPartContext;
}
