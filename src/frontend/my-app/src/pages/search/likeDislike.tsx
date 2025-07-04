import { DislikeAnket, LikeAnket, ReportAnket } from "../../global/icons"
import axios from "axios";
import { useTelegram } from "../../hooks/useTelegram";

const url = import.meta.env.VITE_URL;

const handleError = (err: any) => {
    if (err instanceof Error) {
        console.error(err.message);
    } else {
        console.error('invalid error', err);
    }
}

const deleteIdLocalstorage = () => {
    let arr = JSON.parse(localStorage.getItem('ankets') || '[]');
    arr.shift();
    localStorage.setItem('ankets', JSON.stringify(arr));
}

export const handleLike = async (myId: string, himId: string, updateAnkets: () => void, updateVisable?: () => void) => {
    try {
        const req = await axios.post(`${url}/redisSearch/like/${myId}/${himId}`, {}, {
            validateStatus: () => true
        });

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        deleteIdLocalstorage()
        if (updateVisable) {
            updateVisable()
        }
        updateAnkets()
    } catch (err) {
        handleError(err)
    }
}

export const handleDislike = async (myId: string, himId: string, updateAnkets: () => void, updateVisable?: () => void) => {
    try {
        const req = await axios.post(`${url}/redisSearch/dislike/${myId}/${himId}`, {}, {
            validateStatus: () => true
        });

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        deleteIdLocalstorage();
        if (updateVisable) {
            updateVisable()
        }
        updateAnkets()
    } catch (err) {
        handleError(err)
    }
}

export const handleReport = async (myId: string, himId: string, updateAnkets: () => void) => {
    try {
        const req = await axios.post(`${url}/redisSearch/reported/${myId}/${himId}`, {}, {
            validateStatus: () => true
        });

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        deleteIdLocalstorage();
        updateAnkets()
    } catch (err) {
        handleError(err)
    }
}

export const LikeDislike = ({ himId, updateAnkets }: { himId: string, updateAnkets: () => void }) => {
    const { userData } = useTelegram();
    const myId = userData?.id;

    return (
        <div className="flex gap-8 justify-center items-center">
            <div onClick={() => handleLike(`${myId}`, himId, updateAnkets)}><LikeAnket /></div>
            <div onClick={() => handleReport(`${myId}`, himId, updateAnkets)}><ReportAnket /></div>
            <div onClick={() => handleDislike(`${myId}`, himId, updateAnkets)} ><DislikeAnket /></div>
        </div>
    )
}
