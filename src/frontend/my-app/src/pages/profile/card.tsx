import { DefaultIcon, PremiumIcon } from "../../global/icons";
import type { UserData, Statistic } from "../../global/interfaces";
import { Line } from "../../global/line";
import { WrapperIcons } from "../../global/wrapperIcons";
import { useState, useEffect } from "react";
import axios from "axios";
import { bgClasses, textClasses, shadowClasses, titleClasses, borderClasses } from "../../global/handle";

type propsProfileCard = {
    dataUser: UserData | null;
    iconsStatistick: Statistic[] | string;
    type: string
}

export const ProfileCard = ({ dataUser, iconsStatistick, type }: propsProfileCard) => {
    const [photoAnket, setPhotoAnket] = useState('');
    const botUsername = 'MiniAppTestsss_bot';
    const scene = 'profile';
    const url = `https://t.me/${botUsername}?start=${scene}`;

    useEffect(() => {
        const photoPathUrl = async () => {
            try {

                if (typeof (dataUser) === 'string') {
                    return
                }

                const resUrl = await axios.get(
                    `https://api.telegram.org/bot${import.meta.env.VITE_TELEG_TOKEN}/getFile?file_id=${dataUser?.photoMiniApp}`,
                    { validateStatus: () => true }
                );

                if (!resUrl.data.ok) {
                    throw new Error(`Ошибка Telegram API: ${resUrl.data.description}`);
                }

                const filePath = resUrl.data.result.file_path;


                setPhotoAnket(filePath)
            } catch (err) {
                if (err instanceof Error) {
                    console.log('Ошибка при получении пути изображения', err.message)
                } else {
                    console.log('Неизвестная ошибка при получении пути изображения', err)
                }

                setPhotoAnket(JSON.stringify(err))
            }
        }

        photoPathUrl()
    }, [])

    return (
        <div className={`mt-[30px] ${bgClasses[type]}  flex flex-col justify-center items-center rounded-2xl ${shadowClasses[type]} `}>
            <img src={`https://api.telegram.org/file/bot${import.meta.env.VITE_TELEG_TOKEN}/${photoAnket}`}
                alt="anket photo"
                className=" w-full h-[300px] rounded-xl"
            />
            <div className="flex flex-col justify-center items-center">
                <div className="mt-[10px]">
                    {
                        dataUser?.premium === true
                            ?
                            <PremiumIcon type={type} />
                            :
                            <DefaultIcon type={type} />
                    }
                </div>

                <div className={`text-[14px] font-bold ${titleClasses[type]} text-center mt-[5px]`}>
                    Место в топе: {dataUser?.top}
                </div>

                <div className={`text-3xl font-bold ${titleClasses[type]} text-center mt-[5px]`}>
                    {dataUser?.name}
                </div>

                <div className={`text-[14px] ${textClasses[type]} my-[10px] text-center break-all whitespace-pre-wrap w-full px-3`}>
                    Возраст: {dataUser?.age} <br />
                    Город: {dataUser?.city} <br />
                    Описание: {dataUser?.description} <br />
                    Возрастной диапазон: {dataUser?.minAge} - {dataUser?.maxAge} <br />
                    Пол поиска: {dataUser?.gender ? "Женский" : "Мужской"} <br />
                </div>

                <Line type={type}/>

                <div className="mb-[20px]">
                    <WrapperIcons iconsStatistick={iconsStatistick} type={type} />
                </div>

                <Line type={type}/>
                <div>
                    <div className={`${borderClasses[type]} ${titleClasses[type]} text-[16px] font-montserrat font-bold mb-[20px] cursor-pointer transition-all duration-500 ease-out hover:border-[#5170DE] hover:text-[#5170DE] `} onClick={() => window.open(url, '_blank')}>
                        Изменить
                    </div>
                </div>

            </div>
        </div>
    )
}