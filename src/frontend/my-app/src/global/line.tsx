const lineBacground = {
    default: 'line-default',
    first: 'line-first',
    second: 'line-second',
    third: 'line-third',
    fourth: 'line-fourth',
} as any;

export const Line = ({ type }: { type: string }) => {
    return (
        <span className={`block h-[2px] w-full rounded-full mb-[15px] ${lineBacground[type]}`}></span>
    )
}