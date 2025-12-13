
export type Rule = {
    id: string,
    name: string,
    isActive: boolean,
    value?: string | number,
}

export enum RuleType {
    FORMATTING = 'FORMATTING',
    LINT = 'LINT'
}