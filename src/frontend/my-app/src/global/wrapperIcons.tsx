import type { Statistic } from "./interfaces";
import { titleClasses } from "../global/handle";

type propsWrapperIcons = {
    iconsStatistick: Statistic[] | string;
    type: string
}

export const WrapperIcons = ({ iconsStatistick, type }: propsWrapperIcons) => {


    return (
        <>
            {
                typeof iconsStatistick === "string"
                    ?
                    <div className={`text-[14px] font-bold ${titleClasses[type]} text-center mt-[5px]`}>
                        Ошибка в получении статистики.
                    </div>
                    :

                    <div className="flex justify-center gap-[38px] items-center">
                        {
                            iconsStatistick?.map(item => {
                                const Icon = item.icon;

                                return (
                                    <div className={`flex items-center ${titleClasses[type]}`}>
                                        <Icon />
                                        <span className="text-[15px] ml-[8px]">{item.text}</span>
                                    </div>

                                )
                            })
                        }
                    </div>
            }
        </>

    )
}