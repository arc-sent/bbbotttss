import { useEffect, useState } from "react";
import { useTelegram } from "../../hooks/useTelegram"
import axios from "axios";
import { SpinLoading } from "../../global/spin";
import { SearchCard } from "./card";

export const Search = () => {
    const { userData } = useTelegram();
    const id = userData?.id || '968500846';
    const url = import.meta.env.VITE_URL;
    const [ankets, setAnkets] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('ankets');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [anketsId, setAnketsId] = useState('');
    const [loading, setLoading] = useState(true)
    const [end, setEnd] = useState(false);

    const getSearch = async () => {
        try {
            const req = await axios.get(`${url}/redisSearch/${id}`, {
                validateStatus: () => true
            });

            if (req.status === 400) {
                throw new Error(JSON.stringify(req.data.message));
            }

            if (req.status === 201) {
                setEnd(true)
                setLoading(false)
                return
            }

            setAnkets(req.data.message);
        } catch (err) {
            if (err instanceof Error) {
                console.error(err.message);
            } else {
                console.error('invalid error in search', err);
            }
        }
    };

    const updateAnkets = () => {
        setAnkets(prev => prev.slice(1));
    }

    useEffect(() => {
        if (ankets.length !== 0) return;

        getSearch();
    }, []);

    useEffect(() => {
        if (ankets.length === 0) {
            getSearch()
            return
        }

        setAnketsId(ankets[0]);
        
    }, [ankets]);

    useEffect(() => {
        if (anketsId == '') {
            return
        }

        setLoading(false)
    }, [anketsId]);

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
                                        Нет подходящих анкет
                                    </h1>
                                    <p className="text-[14px] text-default-mini text-center">
                                        Попробуйте изменить настройки поиска или зайдите позже — возможно, появятся новые пользователи.
                                    </p>
                                </div>
                                :
                                <SearchCard himId={anketsId} updateAnkets={updateAnkets} />
                        }
                    </div>

            }
        </>
    );
};
