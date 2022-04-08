import type {ITimelog} from "@/types/ITimelog";

export interface ITimelogResultDay{
    total:number;
    cost:number;
    date:Date;
    logs:ITimelog[]
}