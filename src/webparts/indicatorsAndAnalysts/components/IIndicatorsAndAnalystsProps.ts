import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IIndicatorsAndAnalystsProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  listId?: string;
  analystsListId?: string;
  statusColumn?: string;
  dateTestColumn?: string;
  titleField?: string;
  statusField?: string;
  dueDateField?: string;
  clarificationField?: string;
  spfxContext: WebPartContext;
}
