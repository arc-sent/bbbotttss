export const getTopIcon = (top: number) => {
    if (top === 1) return '👑';
    if (top <= 3) return '🏅';
    if (top <= 10) return '🔥';
    if (top <= 50) return '⚡';
    return '📊';
};

export function formatNumber(num: number) {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toString();
}

export function formatText(rawText: string) {
    return rawText
        .replace(/\\n/g, '\n')
}

export const bgClasses = {
    default: 'bg-default-bg',
    first: 'bg-first-bg',
    second: 'bg-second-bg',
    third: 'bg-third-bg',
    fourth: 'bg-fourth-bg',
    mystery: 'bg-mystery-bg',
} as any;

export const titleClasses = {
    default: 'text-default-title',
    first: 'text-first-title',
    second: 'text-second-title',
    third: 'text-third-title',
    fourth: 'text-fourth-title',
    mystery: 'text-mystery-title',
} as any;

export const borderClasses = {
    default: 'custom-border',
    first: 'custom-border-first',
    second: 'custom-border-second',
    third: 'custom-border-third',
    fourth: 'custom-border-fourth',
    mystery: 'custom-border-mystery',
} as any;

export const textClasses = {
    default: 'text-default-mini',
    first: 'text-first-mini',
    second: 'text-second-mini',
    third: 'text-third-mini',
    fourth: 'text-fourth-mini',
    mystery: 'text-mystery-mini',
} as any;

export const shadowClasses = {
    default: 'shadow-[0px_0px_40px_0px_rgba(152,120,170,0.35)]',
    first: 'shadow-[0px_0px_40px_0px_rgba(135,190,181,0.35)]',
    second: 'shadow-[0px_0px_40px_0px_rgba(135,146,190,0.35)]',
    third: 'shadow-[0px_0px_40px_0px_rgba(190,135,136,0.35)]',
    fourth: 'shadow-[0px_0px_40px_0px_rgba(188,190,135,0.35)]',
    mystery: 'shadow-[0px_0px_40px_0px_rgba(81,112,222,0.35)]',
} as any;



export const typeCаrdFn = (top: number | undefined) => {
    if (top === undefined) return 'default'
    if (top === 1) return 'first';
    if (top === 2) return 'second';
    if (top === 3) return 'third';
    if (top >= 4 && top <= 10) return 'fourth';
    return 'default';
}
