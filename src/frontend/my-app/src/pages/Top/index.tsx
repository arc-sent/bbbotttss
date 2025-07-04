import { useState } from "react";
import { CardTop } from "./cardTop";

export const Top = () => {
    const [count, setCount] = useState(1);

    const prevCount = () => {
        setCount(prev => prev + 1)
    }

    const backCount = () => {
        setCount(prev => prev - 1)
    }

    return (
        <CardTop key={count} count={count} prevCount={prevCount} backCount={backCount} />
    )
}