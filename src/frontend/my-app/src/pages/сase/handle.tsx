import axios from "axios";

export const pluralizeCases = (count: number): string => {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod10 === 1 && mod100 !== 11) return "кейс";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "кейса";
    return "кейсов";
}

export const getRandomInRange = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function updateCase(caseType: string, action: "increment" | "decrement", id: number) {
    try {
        const url = import.meta.env.VITE_URL;

        const req = await axios.put(`${url}/users/${id}/case`, {
            caseType: caseType,
            action: action
        });

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        return true
    } catch (err) {
        console.error(err);
        return false
    }
}


export const updateUserScore = async (count: number, id: number) => {
    try {
        const url = process.env.URL;

        const req = await axios.put(`${url}/users/${id}/gems`, {
            count: count,
            action: "increment"
        });

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        return true
    } catch (err) {
        console.error(err);
        return false
    }
}

export function getRandomCase(): string {
    const random = Math.random() * 100;

    if (random < 45) return "caseBronza";
    if (random < 80) return "caseSilver";
    if (random < 95) return "caseGold";
    return "casePlatinum";
}

export function getRandomCaseEveryDayDefault(): string {
    const random = Math.random() * 100;

    if (random < 55) return "caseBronza";
    if (random < 90) return "caseSilver";
    return "caseGold";
}

export function getRandomCaseEveryDayPremium(): string {
    const random = Math.random() * 100;

    if (random < 45) return "caseSilver";
    if (random < 75) return "caseGold";
    return "casePlatinum";
}

export const textInModal = {
    default: {
        main: `Открыв его, вы можете получить один из следующих кейсов: \n`,
        premium: `Шансы с премиум- доступом: \n
- Серебряный(45 %) \n
- Золотой(30 %) \n
- Платиновый(25 %)
Нажмите кнопку ниже, чтобы открыть ваш кейс.`,
        user: ` Обычные шансы: \n
- Бронзовый(55 %) \n
- Серебряный(35 %) \n
- Золотой(10 %) \n`
    },
    first: `В нем вы можете получить от 5000 до\n 10000 гемов!`,
    second: `В нем вы можете получить от 1000 до\n 2500 гемов!`,
    third: `В нем вы можете получить от от 500 до\n 1000 гемов`,
    fourth: `В нем вы можете получить от 2500 до\n 5000 гемов!`,
    mystery: `Вы можете получить один из следующих кейсов: \n
- Бронзовый(45 %) \n
- Серебряный(35 %) \n
- Золотой(15 %) \n
- Платиновый(5 %)`
} as any

export const GemsCount = {
    first: { min: 5000, max: 10000 },
    second: { min: 1000, max: 2500 },
    third: { min: 500, max: 1000 },
    fourth: { min: 2500, max: 5000 },
} as any

export const typeBoolean = (type: string) => {
    if (type === 'first' || type === 'second' || type === 'third' || type === 'fourth') {
        return true
    } else {
        return false
    }
}

export const typeCasesFn = (name: string) => {
    switch (name) {
        case 'caseMystery':
            return { type: "mystery", name: "мистический кейс" }
        case 'caseSilver':
            return { type: "second", name: "серебрянный кейс" }
        case 'caseGold':
            return { type: "fourth", name: "золотой кейс" }
        case 'casePlatinum':
            return { type: "first", name: "платиновый кейс" }
        case 'caseBronza':
            return { type: "third", name: "бронзовый кейс" }
        default:
            return { type: "error", name: "бронзовый кейс" }
    }
}