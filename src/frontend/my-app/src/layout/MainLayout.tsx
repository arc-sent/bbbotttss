import { useLocation, Link, Outlet } from "react-router-dom";
import { ProfileIcons, SearchIcons, LikeIcons2, MatchIcons, TopIcons, CaseIcons } from "../global/icons";

const LinkUp = [
    {
        text: 'Профиль',
        image: ProfileIcons,
        link: '/profile'
    },
    {
        text: 'Поиск',
        image: SearchIcons,
        link: '/search'
    },
    {
        text: 'Лайки',
        image: LikeIcons2,
        link: '/likes'
    },
    {
        text: 'Метчи',
        image: MatchIcons,
        link: '/match'
    }
];

const LinkDown = [
    {
        text: 'Топ',
        image: TopIcons,
        link: '/top'
    },
    {
        text: 'Кейсы',
        image: CaseIcons,
        link: '/case'
    }
]


const renderLink = (item: any) => {
    const location = useLocation();
    const isActive = item.link === location.pathname;

    const Icon = item.image;

    return (
        <Link
            key={item.text}
            to={item.link}
            className={`flex flex-col items-center mb-0 justify-center text-center ${isActive ? 'text-[#5170DE] drop-shadow-[0_0_6px_rgba(81,112,222,0.8)]' : 'text-[#726097]'} transition-all duration-500 ease-out hover:border-[#5170DE] hover:text-[#5170DE]`}
        >
            <Icon active={isActive} />
            <span className={`text-[7px] mt-0 bg-transparent`}>{item.text}</span>
        </Link>)
};

export default function MainLayout() {
    return (
        <div className="">
            <main className="bg-[#090810] text-white min-h-screen pb-[8vh] flex justify-center">
                <div className="w-80 py-[30px]">
                    <Outlet />
                </div>
            </main>

            <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#0D0D18] text-default-icons py-[13px] px-[55px] z-50 rounded-2xl">
                <div className="flex flex-col gap-[25px]">
                    <div className="flex justify-between gap-[34px] items-center">
                        {LinkUp.map(renderLink)}
                    </div>
                    <div className="flex justify-center gap-[34px] items-center">
                        {LinkDown.map(renderLink)}
                    </div>
                </div>
            </nav>
        </div>
    );
}