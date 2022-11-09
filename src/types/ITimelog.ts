export interface ITimelog {
    [key: string]: any, //otherwise I can't use strings as keys...
    timestamp: number;
    hash: string;
    clients: string[];
    tasks: string[];
    sources: string[];
    projects: string[];
    description: string;
    duration: number;
    normalized: string;
    cost: number;
    rate: number | null;
    parserVersion: string;
}