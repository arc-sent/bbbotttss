export interface UserPUT {
    name: string,
    description: string,
    photo: string,
}

export interface User {
    name: string,
    description: string,
    id: string,
    photo: string,
    city: string,
    age: number,
    minAge: number,
    maxAge: number,
    lat: number,
    lon: number,
    gender: boolean,
    photoMiniApp: string
}

export interface UserPATH {
    name?: string,
    description?: string,
    photo?: string,
    city?: string,
    age?: number,
    ageMinMax: MaxMin,
    viewed: string[],
    photoMiniApp?: string
}

interface MaxMin {
    minAge?: number,
    maxAge?: number
}

export interface PremiumUser {
    premium: boolean,
    days?: number
}

export interface BodyStatistics {
    like?: boolean,
    dislike?: boolean,
    coin?: boolean
}

export interface BodyGems {
    count: number
    action: string
}

export interface BodyCase {
    caseType: string,
    action: string
}