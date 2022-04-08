import type {ITimelogResultDay} from "@/types/ITimelogResultDay";

export interface ITimelogResult {
    days: {
        [index: number]: ITimelogResultDay
    };
    matchedProperties: { [index: string]: string[] };
    range: { [index: string]: number | Date }
}