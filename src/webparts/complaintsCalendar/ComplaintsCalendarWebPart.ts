import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneDropdown,
  type IPropertyPaneDropdownOption
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';
import { spfi, SPFI, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/fields';

import * as strings from 'ComplaintsCalendarWebPartStrings';
import ComplaintsCalendar from './components/ComplaintsCalendar';
import { IComplaintsCalendarProps } from './components/IComplaintsCalendarProps';

export interface IComplaintsCalendarWebPartProps {
  description: string;
  listId: string;
  dateField: string;
  titleField: string;
}

export default class ComplaintsCalendarWebPart extends BaseClientSideWebPart<IComplaintsCalendarWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';
  private _listOptions: IPropertyPaneDropdownOption[] = [];
  private _dateFieldOptions: IPropertyPaneDropdownOption[] = [];
  private _titleFieldOptions: IPropertyPaneDropdownOption[] = [];

  public render(): void {
    const element: React.ReactElement<IComplaintsCalendarProps> = React.createElement(
      ComplaintsCalendar,
      {
        description: this.properties.description,
        listId: this.properties.listId,
        dateField: this.properties.dateField,
        titleField: this.properties.titleField,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        spfxContext: this.context
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return super.onInit().then(_ => {
      // PnP v3 automatically detects SPFx context
      return this._getEnvironmentMessage().then(message => {
        this._environmentMessage = message;
      });
    });
  }


  protected onPropertyPaneConfigurationStart(): void {
    if (this._listOptions.length === 0) {
      this._loadLists().then(() => {
        this.context.propertyPane.refresh();
        this.render();
      });
    }

    if (this.properties.listId) {
      this._loadDateFields(this.properties.listId).then(() => {
        this.context.propertyPane.refresh();
      });
      
      this._loadTitleFields(this.properties.listId).then(() => {
        this.context.propertyPane.refresh();
      });
    }
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: any, newValue: any): void {
    if (propertyPath === 'listId' && newValue && newValue !== oldValue) {
      this.properties.dateField = '';
      this.properties.titleField = '';
      this._dateFieldOptions = [];
      this._titleFieldOptions = [];
      this._loadDateFields(newValue).then(() => {
        this.context.propertyPane.refresh();
        this.render();
      });
      this._loadTitleFields(newValue).then(() => {
        this.context.propertyPane.refresh();
        this.render();
      });
    }
  }

  private async _loadLists(): Promise<void> {
    const sp: SPFI = spfi().using(SPFx(this.context));
    const lists = await sp.web.lists.filter("Hidden eq false and (BaseTemplate eq 100 or BaseTemplate eq 107)").select("Id", "Title")();
    this._listOptions = lists.map((l: any) => ({ key: l.Id, text: l.Title }));
  }

  private async _loadDateFields(listId: string): Promise<void> {
    const sp: SPFI = spfi().using(SPFx(this.context));
    const fields = await sp.web.lists.getById(listId).fields.filter("Hidden eq false and ReadOnlyField eq false and TypeAsString eq 'DateTime'").select("InternalName", "Title")();
    this._dateFieldOptions = fields.map((f: any) => ({ key: f.InternalName, text: f.Title || f.InternalName }));
  }

  private async _loadTitleFields(listId: string): Promise<void> {
    const sp: SPFI = spfi().using(SPFx(this.context));
    const fields = await sp.web.lists.getById(listId).fields.filter("Hidden eq false and ReadOnlyField eq false and (TypeAsString eq 'Text' or TypeAsString eq 'Note')").select("InternalName", "Title")();
    this._titleFieldOptions = fields.map((f: any) => ({ key: f.InternalName, text: f.Title || f.InternalName }));
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
                  label: strings.ListFieldLabel,
                  options: this._listOptions,
                  disabled: this._listOptions.length === 0
                }),
                PropertyPaneDropdown('dateField', {
                  label: strings.DateFieldLabel,
                  options: this._dateFieldOptions,
                  disabled: !this.properties.listId || this._dateFieldOptions.length === 0
                }),
                PropertyPaneDropdown('titleField', {
                  label: strings.TitleFieldLabel,
                  options: this._titleFieldOptions,
                  disabled: !this.properties.listId || this._titleFieldOptions.length === 0
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
