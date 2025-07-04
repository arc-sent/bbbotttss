import { useEffect } from "react";
import { useTelegram } from "../../hooks/useTelegram"
import axios from "axios";
import { useState } from "react";
import { DislikeIcons, GemsIcons, LikeIcons } from "../../global/icons";
import type { UserData, Statistic } from "../../global/interfaces";
import { SpinLoading } from "../../global/spin";
import { HeaderProfile } from "./header";
import { formatNumber } from "../../global/handle";
import { ProfileCard } from "./card";
import { typeCаrdFn } from '../../global/handle';

export const Profile = () => {
    const { userData } = useTelegram();
    const [dataUser, setDataUser] = useState<UserData | string>('');
    const [loading, setLoading] = useState(true);
    const [iconsStatistick, setIconsStatistick] = useState<Statistic[] | string>('');
    const id = userData?.id;
    const [type, setType] = useState('');

    useEffect(() => {
        if (typeof dataUser === "string") return;

        setIconsStatistick([
            {
                text: formatNumber(dataUser.like),
                icon: LikeIcons
            },
            {
                text: formatNumber(dataUser.dislike),
                icon: DislikeIcons
            },
            {
                text: formatNumber(dataUser.coin),
                icon: GemsIcons
            }
        ]);

        const resData = typeCаrdFn(dataUser.top);

        setType(resData);
    }, [dataUser])

    useEffect(() => {
        const getUserData = async () => {
            try {
                const url = import.meta.env.VITE_URL;

                const req = await axios.get(`${url}/users/${id}`, {
                    validateStatus: () => true
                });

                if (req.status === 400) {
                    throw new Error(JSON.stringify(req.data.message));
                }

                setDataUser(req.data.message)
            } catch (err) {
                if (err instanceof Error) {
                    console.log('Ошибка при получении пути изображения', err.message)
                } else {
                    console.log('Неизвестная ошибка при получении пути изображения', err)
                }

                setDataUser(JSON.stringify(err))
            }
        }

        getUserData()
    }, []);

    useEffect(() => {
        setLoading(false)
    }, [dataUser])

    if (typeof (dataUser) === 'string') {
        return <SpinLoading />
    }

    return (
        <>
            {
                loading === true
                    ?
                    <SpinLoading />
                    :
                    <div className="pb-[100px]">
                        <HeaderProfile dataUser={dataUser} iconsStatistick={iconsStatistick} type={type} id={`${id}`} />
                        <ProfileCard dataUser={dataUser} iconsStatistick={iconsStatistick} type={type} />
                    </div>
            }
        </>

    )
}
