declare interface IGesRecWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
  ComplaintsAppUrlFieldLabel: string;
  ServicingAppUrlFieldLabel: string;
  ReportsUrlFieldLabel: string;
  SearchUrlFieldLabel: string;
  AppLocalEnvironmentSharePoint: string;
  AppLocalEnvironmentTeams: string;
  AppLocalEnvironmentOffice: string;
  AppLocalEnvironmentOutlook: string;
  AppSharePointEnvironment: string;
  AppTeamsTabEnvironment: string;
  AppOfficeEnvironment: string;
  AppOutlookEnvironment: string;
  UnknownEnvironment: string;
}

declare module 'GesRecWebPartStrings' {
  const strings: IGesRecWebPartStrings;
  export = strings;
}
