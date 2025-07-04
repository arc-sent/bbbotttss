import { useEffect, useState } from "react";
import { useTelegram } from "../../hooks/useTelegram";
import axios from "axios";
import { SpinLoading } from "../../global/spin";
import { MatchesCard } from "./cardMatch";

export const Match = () => {
    const { userData } = useTelegram();
    const [match, setMatch] = useState<string[]>([]);
    const [anketsData, setAnketsData] = useState({});
    const [loading, setLoading] = useState(true)
    const [end, setEnd] = useState(false);
    const [count, setCount] = useState(0);

    const myId = userData?.id;

    const getMatch = async () => {
        try {
            const url = import.meta.env.VITE_URL

            const req = await axios.get(
                `${url}/matchReal/${myId}`
                ,
                {
                    validateStatus: () => true
                }
            );

            if (req.status === 400) {
                throw new Error(req.data.message)
            }

            if (req.status === 200 && req.data.message.length === 0) {
                setEnd(true);
                setLoading(false)
                return
            }

            setMatch(req.data.message)
        } catch (err) {
            if (err instanceof Error) {
                console.error(err.message);
            } else {
                console.error('invalid error', err);
            }
        }
    }

    const prevCount = () => {
        setCount(prev => prev + 1);
    }

    const backCount = () => {
        setCount(prev => prev - 1);
    }

    useEffect(() => {
        if (match.length !== 0) return

        getMatch()
    }, []);

    useEffect(() => {
        setLoading(false)
    }, [anketsData]);

    useEffect(() => {
        if (match.length == 0) {
            setLoading(true)
            return
        }

        setAnketsData(match[count]);
    }, [match, count]);

    return (
        <>
            {
                loading === true
                    ?
                    <SpinLoading />
                    :
                    <div className="pb-[100px]">
                        {
                            end
                                ?
                                <div className=" text-center flex flex-col justify-center items-center min-h-[70vh]">
                                    <h1 className=" text-default-title font-bold text-[34px]">
                                        Пока нет метчей
                                    </h1>
                                    <p className="text-[14px] text-default-mini text-center">
                                        Но не переживайте! Как только кто-то лайкнет вас в ответ, вы сразу узнаете об этом
                                    </p>
                                </div>
                                :
                                <MatchesCard key={count} anketsData={anketsData} prevCount={prevCount} backCount={backCount} count={count} match={match}/>
                        }
                    </div>
            }
        </>
    )
}