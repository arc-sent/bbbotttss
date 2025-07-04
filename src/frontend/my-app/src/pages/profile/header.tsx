import { DefaultIcon, PremiumIcon } from "../../global/icons";
import { useEffect, useState } from "react";
import type { UserData, Statistic } from "../../global/interfaces";
import { Line } from "../../global/line";
import { WrapperIcons } from "../../global/wrapperIcons";
import axios from "axios";
import { useTelegram } from "../../hooks/useTelegram"
import { bgClasses, textClasses, shadowClasses, titleClasses } from "../../global/handle";

type propsHeaderProfile = {
    dataUser: UserData | null;
    iconsStatistick: Statistic[] | string;
    id: string;
    type: string;
}

export const HeaderProfile = ({ dataUser, iconsStatistick, id, type }: propsHeaderProfile) => {
    const { userData } = useTelegram();

    const [pathUrl, setPathUrl] = useState<string | boolean>('');
    const [urlAva, setUrlAva] = useState('');

    useEffect(() => {
        const pictureUrl = async () => {
            try {
                const req = await axios.get(`${import.meta.env.VITE_URL}/users/${id}/photo`, {
                    validateStatus: () => true
                });

                if (req.status === 400) {
                    throw new Error(JSON.stringify(req.data.message));
                }

                console.log(req.data.message)

                setPathUrl(req.data.message);
            } catch (err) {
                if (err instanceof Error) {
                    console.log('Ошибка при получении пути изображения', err.message)
                } else {
                    console.log('Неизвестная ошибка при получении пути изображения', err)
                }

                setPathUrl(false)
            }
        }

        pictureUrl();
    }, [id])

    useEffect(() => {
        console.log("pathUrl", pathUrl);

        setUrlAva(`https://api.telegram.org/file/bot${import.meta.env.VITE_TELEG_TOKEN}/${pathUrl}`)
    }, [pathUrl])

    return (
        <div className={`py-[10px] px-10 ${bgClasses[type]}  flex flex-col justify-center items-center rounded-2xl ${shadowClasses[type]}`}>
            {
                !pathUrl
                    ?
                    <span className="inline-block w-[108px] h-[108px] rounded-full bg-gradient-to-br from-[#9D7CB2] to-[#5170DE]"></span>
                    :
                    <img src={urlAva} alt="image" className="h-[108px] w-[108px] rounded-full" />
            }

            {
                dataUser?.premium === true
                    ?
                    <PremiumIcon type={type} />
                    :
                    <DefaultIcon type={type} />
            }

            <div className={`text-3xl font-bold ${titleClasses[type]}`}>
                {userData?.first_name}
            </div>

            <div className={`text-[14px] ${textClasses[type]} my-[10px]`}>
                id: {userData?.id}
            </div>

            <Line type={type} />

            <WrapperIcons iconsStatistick={iconsStatistick} type={type} />
        </div >
    )
}