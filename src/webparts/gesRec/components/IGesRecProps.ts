import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IGesRecProps {
  description: string;
  complaintsAppUrl: string;
  servicingAppUrl: string;
  reportsUrl: string;
  searchUrl: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  spfxContext: WebPartContext;
  complaintsListId?: string;
  complaintsDocumentsListId?: string;
  complaintsArchiveListId?: string;
  archiveDocumentsListId?: string;
  hideSharePointElements?: boolean;
}
