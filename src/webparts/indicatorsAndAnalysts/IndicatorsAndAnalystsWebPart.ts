import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneDropdown
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';

import * as strings from 'IndicatorsAndAnalystsWebPartStrings';
import IndicatorsAndAnalysts from './components/IndicatorsAndAnalystsRefactored';
import { IIndicatorsAndAnalystsProps } from './components/IIndicatorsAndAnalystsProps';
import { IIndicatorsAndAnalystsWebPartProps } from './IIndicatorsAndAnalystsWebPartProps';

export default class IndicatorsAndAnalystsWebPart extends BaseClientSideWebPart<IIndicatorsAndAnalystsWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';
  private _availableLists: { key: string; text: string }[] = [];
  private _availableColumns: { key: string; text: string }[] = [];

  public render(): void {
    console.log('WebPart render called with context:', {
      hasContext: !!this.context,
      hasPageContext: !!this.context?.pageContext,
      hasWeb: !!this.context?.pageContext?.web,
      webUrl: this.context?.pageContext?.web?.absoluteUrl,
      listId: this.properties.listId
    });
    
    const element: React.ReactElement<IIndicatorsAndAnalystsProps> = React.createElement(
      IndicatorsAndAnalysts,
      {
        description: this.properties.description,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        listId: this.properties.listId,
        analystsListId: this.properties.analystsListId,
        statusColumn: this.properties.statusColumn,
        dateTestColumn: this.properties.dateTestColumn,
        titleField: this.properties.titleField,
        statusField: this.properties.statusField,
        dueDateField: this.properties.dueDateField,
        clarificationField: this.properties.clarificationField,
        spfxContext: this.context
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return Promise.all([
      this._getEnvironmentMessage(),
      this._loadSharePointLists()
    ]).then(([message]) => {
      this._environmentMessage = message;
    });
  }

  private _loadSharePointLists(): Promise<void> {
    return this.context.spHttpClient.get(
      `${this.context.pageContext.web.absoluteUrl}/_api/web/lists?$filter=Hidden eq false&$select=Id,Title`,
      SPHttpClient.configurations.v1
    )
    .then((response: SPHttpClientResponse): Promise<{ value: any[] }> => {
      return response.json();
    })
    .then((listsResponse: { value: any[] }): void => {
      this._availableLists = listsResponse.value.map((list: any) => ({
        key: list.Id,
        text: list.Title
      }));
    })
    .catch((error: any): void => {
      console.error('Error loading SharePoint lists:', error);
      this._availableLists = [];
    });
  }

  private _loadSharePointColumns(listId: string): Promise<void> {
    if (!listId) {
      this._availableColumns = [];
      return Promise.resolve();
    }

    return this.context.spHttpClient.get(
      `${this.context.pageContext.web.absoluteUrl}/_api/web/lists('${listId}')/fields?$filter=Hidden eq false and ReadOnlyField eq false&$select=InternalName,Title`,
      SPHttpClient.configurations.v1
    )
    .then((response: SPHttpClientResponse): Promise<{ value: any[] }> => {
      return response.json();
    })
    .then((columnsResponse: { value: any[] }): void => {
      this._availableColumns = columnsResponse.value.map((column: any) => ({
        key: column.InternalName,
        text: column.Title
      }));
    })
    .catch((error: any): void => {
      console.error('Error loading SharePoint columns:', error);
      this._availableColumns = [];
    });
  }

  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: any, newValue: any): void {
    if (propertyPath === 'listId' && newValue !== oldValue) {
      // Load columns when list changes
      this._loadSharePointColumns(newValue).then(() => {
        this.context.propertyPane.refresh();
      });
    }
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyPaneDropdown('listId', {
                  label: 'Select SharePoint List',
                  options: this._availableLists,
                  selectedKey: this.properties.listId
                }),
                PropertyPaneDropdown('analystsListId', {
                  label: 'Select Analysts List',
                  options: this._availableLists,
                  selectedKey: this.properties.analystsListId
                }),
                PropertyPaneDropdown('statusColumn', {
                  label: 'Status Column',
                  options: this._availableColumns,
                  selectedKey: this.properties.statusColumn,
                  disabled: !this.properties.listId
                }),
                PropertyPaneDropdown('dateTestColumn', {
                  label: 'Date Test Column',
                  options: this._availableColumns,
                  selectedKey: this.properties.dateTestColumn,
                  disabled: !this.properties.listId
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
