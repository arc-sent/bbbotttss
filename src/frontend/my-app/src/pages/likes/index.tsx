import { useEffect, useState } from "react";
import { useTelegram } from "../../hooks/useTelegram";
import axios from "axios";
import { SpinLoading } from "../../global/spin";
import { LikesCard } from "./cardLikes";


export const Like = () => {
    const { userData } = useTelegram();
    const [likes, setLikes] = useState<string[]>([]);
    const myId = userData?.id;
    const [anketsData, setAnketsData] = useState({});
    const [loading, setLoading] = useState(true)
    const [end, setEnd] = useState(false);

    const updateAnkets = () => {
        setLikes(prev => prev.slice(1));
    }

    const getLike = async () => {
        try {
            const url = import.meta.env.VITE_URL

            const req = await axios.get(
                `${url}/likes/${myId}`
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

            setLikes(req.data.message)
        } catch (err) {
            if (err instanceof Error) {
                console.error(err.message);
            } else {
                console.error('invalid error', err);
            }
        }
    }

    useEffect(() => {
        if (likes.length !== 0) return

        getLike()
    }, []);

    useEffect(() => {
        if (likes.length === 0) {
            getLike()
            return
        }

        setAnketsData(likes[0])
    }, [likes]);


    useEffect(() => {
        setLoading(false)
    }, [anketsData])

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
                                        Пока нет лайков
                                    </h1>
                                    <p className="text-[14px] text-default-mini text-center">
                                        Но не переживайте! Ваша анкета уже в поиске. Добавьте больше фото и заполните профиль, чтобы привлечь внимание!
                                    </p>
                                </div>
                                :
                                <LikesCard anketsData={anketsData} updateAnkets={updateAnkets} />
                        }
                    </div>

            }
        </>
    )
}