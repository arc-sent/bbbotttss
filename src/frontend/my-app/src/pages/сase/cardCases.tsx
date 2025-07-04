import React, { useState } from "react";
import type { Cases } from "../../global/interfaces";
import { IconsCase, CaseModalStars, GemsModal } from "./icons";
import { Modal } from "../../global/modal";
import 'antd/dist/reset.css';
import { bgClasses, textClasses, shadowClasses, titleClasses, borderClasses } from "../../global/handle";
import { GemsCount, getRandomCaseEveryDayDefault, getRandomCaseEveryDayPremium, pluralizeCases, textInModal } from "./handle";
import { CloseIcon } from "./icons";
import { typeBoolean, getRandomInRange, updateCase, getRandomCase } from "./handle";
import { typeCasesFn } from "./handle";

type CaseProps = {
    item: Cases;
    length: number;
    index: number;
    id: string | number;
    onUpdate: () => void;
    premium: boolean
}

interface CaseTypeFn {
    type: string;
    name: string;
}

export const CasesCard = ({ item, length, index, id, onUpdate, premium }: CaseProps) => {
    const [isOpen, setOpen] = useState(false);
    const [isOpenGems, setOpenGems] = useState(false);
    const [random, setRandom] = useState<number | string>(0);

    const [isOpenCases, setIsOpenCases] = useState(false);
    const [typeCases, setTypeCases] = useState<CaseTypeFn>({ type: "", name: "" });

    const onClose = () => {
        setOpen(false)
    }

    const onOpen = () => {
        setOpen(true)
    }

    const onCloseGems = () => {
        setOpenGems(false)
        onUpdate()
    }

    const onCloseCase = () => {
        setIsOpenCases(false)
        onUpdate()
    }

    const handleClick = async (type: string, typeCase: string) => {
        const typeBoolean2 = typeBoolean(type);

        if (typeBoolean2) {
            try {
                const countGems = GemsCount[type]
                const random = getRandomInRange(countGems.min, countGems.max);

                const boolCase = await updateCase(typeCase, "decrement", Number(id))

                if (!boolCase) {
                    throw new Error('Ошибка в обновлении кейса!');
                }

                setRandom(random)
                onClose()
                setOpenGems(true)
            } catch (err) {
                if (err instanceof Error) {
                    console.error(err.message)
                } else {
                    console.error('inmalid error', err);
                }
            }

        } else {
            try {

                let random

                if (type === "mystery") {
                    random = getRandomCase();
                } else {
                    if (premium) {
                        random = getRandomCaseEveryDayPremium()
                    } else {
                        random = getRandomCaseEveryDayDefault()
                    }
                }


                const typeCases = typeCasesFn(random)
                const boolCase = await updateCase(typeCase, "decrement", Number(id))

                if (!boolCase) {
                    throw new Error('Ошибка в обновлении кейса!');
                }

                const boolCaseRandom = await updateCase(random, "increment", Number(id))

                if (!boolCaseRandom) {
                    throw new Error('Ошибка в обновлении кейса при получении!');
                }

                setTypeCases(typeCases)
                setRandom(random)
                onClose()
                setIsOpenCases(true)
            } catch (err) {
                if (err instanceof Error) {
                    console.error(err.message)
                } else {
                    console.error('inmalid error', err);
                }
            }
        }

    }

    const isLastOdd = length % 2 !== 0 && index === length - 1;
    const parts = item.text.split(' ');

    return (
        <>
            <div
                className={`
                ${bgClasses[item.type]} 
                ${shadowClasses[item.type]} 
                p-[4px] 
                ${isLastOdd ? 'w-full' : 'w-[calc(50%-10px)]'}
                transition-transform duration-200 ease-in-out
                hover:-translate-y-1
                rounded-xl
                cursor-pointer
            `}
                onClick={onOpen}
            >
                <span className={`text-[15px] ml-[8px] ${titleClasses[item.type]}`}>{item.count}</span>
                <div className={`flex items-center flex-col mb-[15px] justify-center font-bold ${titleClasses[item.type]}`}>
                    <IconsCase />
                    <span className="text-[15px] text-center">
                        {parts.map((part, i) => (
                            <React.Fragment key={i}>
                                {part}
                                {i !== parts.length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </span>
                </div>
            </div>

            <Modal isOpen={isOpen} type={item.type}>
                <div className={`${titleClasses[item.type]} w-[270px]`}>
                    <div className="flex justify-end items-end">
                        <div onClick={onClose} className="cursor-pointer">
                            <CloseIcon />
                        </div>
                    </div>
                    <div className={`${titleClasses[item.type]} flex flex-col justify-center items-center text-center`}>
                        <CaseModalStars />
                        <h1 className={`text-2xl font-bold ${titleClasses[item.type]}`} >У тебя есть {item.count} {pluralizeCases(Number(item.count))}</h1>
                        {
                            item.type === "default"
                                ?
                                <p
                                    className={`text-[12px] ${textClasses[item.type]}`}
                                    dangerouslySetInnerHTML={{
                                        __html: textInModal[item.type].main + textInModal[item.type][premium ? "premium" : "user"]
                                            .split('\n')
                                            .map((line: any) => `<span style="display:block; margin-bottom:4px;">${line}</span>`)
                                            .join('')
                                    }}
                                />
                                :
                                <p
                                    className={`text-[12px] ${textClasses[item.type]}`}
                                    dangerouslySetInnerHTML={{
                                        __html: textInModal[item.type]
                                            .split('\n')
                                            .map((line: any) => `<span style="display:block; margin-bottom:4px;">${line}</span>`)
                                            .join('')
                                    }}
                                />
                        }


                        {
                            Number(item.count) !== 0
                                ?
                                <button onClick={() => {
                                    handleClick(item.type, item.typeCase);
                                }} className={`${borderClasses[item.type]} ${titleClasses[item.type]} text-[16px] font-montserrat font-bold cursor-pointer transition-all duration-500 ease-out hover:border-[#5170DE] hover:text-[#5170DE]`}>
                                    Открыть
                                </button>
                                :
                                <button onClick={onClose} className={`${borderClasses[item.type]} ${titleClasses[item.type]} text-[16px] font-montserrat font-bold cursor-pointer transition-all duration-500 ease-out hover:border-[#5170DE] hover:text-[#5170DE]`}>
                                    Закрыть
                                </button>
                        }
                    </div>
                </div>

            </Modal>

            <Modal isOpen={isOpenGems} type={"mystery"}>
                <div className={`${titleClasses["mystery"]} w-[270px]`}>
                    <div className={`${titleClasses["mystery"]} flex flex-col justify-center items-center text-center`}>
                        <div className="mb-[7px]">
                            <GemsModal />
                        </div>

                        <h1 className={`text-2xl font-bold ${titleClasses["mystery"]}`} >Поздравляем</h1>

                        <p className={`text-[12px] ${textClasses["mystery"]}`}>
                            <span style={{ display: 'block', marginBottom: '4px' }}>Вы выиграли </span>
                            <span style={{ display: 'block' }}>
                                <span className={`${titleClasses["mystery"]} font-bold`}>
                                    {random}
                                </span> гемов!
                            </span>
                        </p>
                        <button onClick={onCloseGems} className={`${borderClasses["mystery"]} ${titleClasses["mystery"]} text-[16px] font-montserrat font-bold cursor-pointer transition-all duration-500 ease-out hover:border-[#5170DE] hover:text-[#5170DE]`}>
                            Закрыть
                        </button>
                    </div>
                </div>

            </Modal>

            <Modal isOpen={isOpenCases} type={typeCases.type}>
                <div className={`${titleClasses[typeCases.type]} w-[270px]`}>
                    <div className={`${titleClasses[typeCases.type]} flex flex-col justify-center items-center text-center`}>
                        <div className="mb-[7px]">
                            <CaseModalStars />
                        </div>

                        <h1 className={`text-2xl font-bold ${titleClasses[typeCases.type]}`} >Поздравляем</h1>

                        <p className={`text-[12px] ${textClasses[typeCases.type]}`}>
                            Вы выиграли {typeCases.name}!
                        </p>
                        <button onClick={onCloseCase} className={`${borderClasses[typeCases.type]} ${titleClasses[typeCases.type]} text-[16px] font-montserrat font-bold cursor-pointer transition-all duration-500 ease-out hover:border-[#5170DE] hover:text-[#5170DE]`}>
                            Закрыть
                        </button>
                    </div>
                </div>

            </Modal>
        </>
    )
}