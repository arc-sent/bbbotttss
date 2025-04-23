import { Scenes } from "telegraf";

export interface State {
    name: Obj,
    description: Obj
    photo: Obj,
}
export interface MyContext extends Scenes.WizardContext {
    session: any
}
export interface useState {
    [key: string]: State
}

interface Obj {
    value?: string,
    edit?: boolean
}

export interface StateSave {
    name?: string,
    description?: string,
    photo?: string
}

export interface BodyStatistics {
    like?: boolean,
    dislike?: boolean,
    coin?: boolean
}

export interface CHANNELS {
    id: number,
    nickname: string
}