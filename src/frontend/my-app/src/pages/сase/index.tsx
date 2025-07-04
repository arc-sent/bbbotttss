import { useEffect, useState } from "react";
import { useTelegram } from "../../hooks/useTelegram";
import { HeaderProfile } from "../profile/header";
import { formatNumber } from "../../global/handle";
import { DislikeIcons, GemsIcons, LikeIcons } from "../../global/icons";
import type { UserData, Statistic, Cases } from "../../global/interfaces";
import axios from "axios";
import { SpinLoading } from "../../global/spin";
import { CasesCard } from "./cardCases";
import { typeCаrdFn } from '../../global/handle';

export const Case = () => {
    const { userData } = useTelegram();
    const [iconsStatistick, setIconsStatistick] = useState<Statistic[] | string>('');
    const [cases, setCases] = useState<Cases[] | string>('');
    const [dataUser, setDataUser] = useState<UserData | string>('');
    const [premium, setPremium] = useState(false);
    const [type, setType] = useState('');
    const id = userData?.id;

    const getUserData = async () => {
        try {
            const url = import.meta.env.VITE_URL;

            const req = await axios.get(`${url}/users/${id}`, {
                validateStatus: () => true
            });

            if (req.status === 400) {
                throw new Error(JSON.stringify(req.data.message));
            }

            const message = req.data.message;

            setDataUser(message);

            setCases([
                {
                    count: formatNumber(message.caseEveryDay),
                    text: "Бесплатный кейс",
                    type: "default",
                    typeCase: "caseEveryDay"
                },
                {
                    count: formatNumber(message.caseBronza),
                    text: "Бронзовый кейс",
                    type: "third",
                    typeCase: "caseBronza"
                },
                {
                    count: formatNumber(message.caseSilver),
                    text: "Серебрянный кейс",
                    type: "second",
                    typeCase: "caseSilver"
                },
                {
                    count: formatNumber(message.caseGold),
                    text: "Золотой кейс",
                    type: "fourth",
                    typeCase: "caseGold"
                },
                {
                    count: formatNumber(message.casePlatinum),
                    text: "Платиновый кейс",
                    type: "first",
                    typeCase: "casePlatinum"
                },
                {
                    count: formatNumber(message.caseMystery),
                    text: "Мистический кейс",
                    type: "mystery",
                    typeCase: "caseMystery"
                },
            ]);

            setPremium(message.premium);
            const resData = typeCаrdFn(message.top);

            setType(resData);
        } catch (err) {
            if (err instanceof Error) {
                console.log('Ошибка при получении пути изображения', err.message)
            } else {
                console.log('Неизвестная ошибка при получении пути изображения', err)
            }

            setDataUser(JSON.stringify(err))
        }
    }

    useEffect(() => {

        getUserData()
    }, []);

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
        ])
    }, [dataUser])

    if (typeof (dataUser) === 'string' || typeof (cases) === 'string') return <SpinLoading />

    return (
        <div className="pb-[100px]">
            <HeaderProfile dataUser={dataUser} iconsStatistick={iconsStatistick} type={type} id={`${id}`} />

            <div className="flex flex-wrap gap-x-[20px] gap-y-[20px] mt-[45px]">
                {
                    cases.map((item, index) => (
                        <CasesCard
                            key={index}
                            item={item}
                            length={cases.length}
                            index={index}
                            id={`${id}`}
                            onUpdate={getUserData}
                            premium={premium}
                        />
                    ))
                }
            </div>
        </div>
    )
}
