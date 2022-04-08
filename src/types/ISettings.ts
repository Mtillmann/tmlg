export interface ISettings {
    [key: string]: any
    filenameTemplate: string;
    dateFormat: string;
    dateRangeFormat: string;
    closeFiltersOnApply?: boolean;
    checkForUpdateIntervalMinutes?: number;
    storeOnControlEnter?: boolean;
    clearTimeLogOnStore?: boolean;
    showParsePreviewOnType?: boolean;
    keepOriginalLogOnEdit?: boolean,
    defaultDuration: number;
    hourThreshold: number;
    defaultRate: number;
    currencyFormat: string;
    rateIncludesTax: boolean;
    tax: number;
    showCostColumn: boolean;
    showProjectColumn: boolean;
    showSourceColumn: boolean;
    showClientColumn: boolean;
    showTaskColumn: boolean;
    showDupeButton: boolean;
    defaultClient: string;
    defaultProject: string;
    defaultTask: string;
    defaultSource: string;
    deviceName: null | string;
    deviceId: null | string;
    syncEnabled: boolean;
    syncSettings: boolean;
    defaultView?: string;
    showHelpIcon?: boolean;
    cli_syncOnSave?: boolean;
}