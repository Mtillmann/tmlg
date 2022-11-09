import type {ITimelog} from "@/types/ITimelog";

export interface IDecoratedTimelog extends ITimelog {

    usesDefaultClient: boolean,
    usesDefaultProject: boolean,
    usesDefaultTask: boolean,
    usesDefaultSource: boolean,
    usesDefaultDuration: boolean,
    usesDefaultDate: boolean,
    usesDefaultRate: boolean,
    isTimer: boolean
}