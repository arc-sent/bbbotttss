import { DefaultIcon, PremiumIcon } from "../../global/icons";
import type { UserData, Statistic } from "../../global/interfaces";
import { Line } from "../../global/line";
import { WrapperIcons } from "../../global/wrapperIcons";
import { useState, useEffect } from "react";
import axios from "axios";
import { DislikeIcons, GemsIcons, LikeIcons } from "../../global/icons";
import { formatNumber, typeCаrdFn } from "../../global/handle";
import { useSwipeable } from 'react-swipeable';
import { motion, useAnimation } from "framer-motion";
import { ModalError } from "../../global/errorModal";
import { bgClasses, textClasses, shadowClasses, titleClasses } from "../../global/handle";

export const CardTop = ({ count, prevCount, backCount }: { count: number, prevCount: () => void, backCount: () => void }) => {
    const [photoAnket, setPhotoAnket] = useState('');
    const [dataUser, setDataUser] = useState<UserData | string>('');
    const [iconsStatistick, setIconsStatistick] = useState<Statistic[] | string>('');
    const [isVisible, setIsVisible] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [textError, setTextError] = useState('');
    const [type, setType] = useState('');

    const onClose = () => {
        setIsOpen(false)
        setTextError('')
    }

    const controls = useAnimation();

    const handleSwipe = async (direction: "left" | "right") => {
        const offset = direction === "left" ? -300 : 300;

        await controls.start({
            x: offset,
            rotate: direction === "left" ? -20 : 20,
            opacity: 0,
            transition: { duration: 0.5, ease: "easeInOut" }
        });

        setIsVisible(false);

        if (direction === "left") {
            setIsVisible(true);
            prevCount()
        } else {
            setIsVisible(true);
            backCount();
        }
    };

    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => {
            handleSwipe("left")
        },
        onSwipedRight: () => {
            if (count === 1) {
                setTextError('Вы можете cделать только свайп влево.')
                setIsOpen(true)
                return
            }

            handleSwipe("right")
        },
        trackMouse: true
    });

    useEffect(() => {
        const getUserData = async () => {
            try {
                const url = import.meta.env.VITE_URL;

                const req = await axios.get(`${url}/users/top/${count}`, {
                    validateStatus: () => true
                });

                if (req.status === 400) {
                    throw new Error(JSON.stringify(req.data.message));
                }

                const dataUserReq = req.data.message

                setDataUser(dataUserReq)

                const resData = typeCаrdFn(dataUserReq.top);

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

        getUserData()
    }, [count]);

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
    }, [dataUser])

    if (!isVisible) return null;

    if (typeof dataUser === 'string') {
        return (
            <div className=" text-center flex flex-col justify-center items-center min-h-[70vh]">
                <h1 className=" text-default-title font-bold text-[34px]">
                    Произошла ошибка
                </h1>
                <p className="text-[14px] text-default-mini text-center mt-[10px]">
                    В получении анкеты! <br /> Возможно, временные неполадки. Попробуйте обновить или зайдите позже.
                </p>

                <div className="custom-border text-[#9374AB] text-[16px] font-montserrat font-bold mb-[20px] cursor-pointer transition-all duration-500 ease-out hover:border-[#5170DE] hover:text-[#5170DE] mt-[15px]"
                    onClick={() => {
                        window.location.reload();
                    }}>
                    Обновить
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="pb-[100px]">
                <motion.div
                    {...swipeHandlers}
                    animate={controls}
                    initial={{ x: 0, rotate: 0, opacity: 1 }}
                    className={`mt-[30px] ${bgClasses[type]} ${shadowClasses[type]} flex flex-col justify-center items-center rounded-2xl transition-transform duration-300 ease-in-out`}
                >
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
                            Пол: {dataUser?.gender ? "Женский" : "Мужской"} <br />
                            Описание: {dataUser?.description} <br />
                        </div>

                        <Line type={type}/>

                        <div className="mb-[30px]">
                            <WrapperIcons iconsStatistick={iconsStatistick} type={type}/>
                        </div>
                    </div>
                </motion.div>
            </div>

            <ModalError isOpen={isOpen} onClose={onClose} text={textError} />
        </>
    )
}
