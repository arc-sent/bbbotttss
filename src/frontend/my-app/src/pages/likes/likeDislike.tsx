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

const deletePending = async (penId: string) => {
    try {
        const urlDelete = `${import.meta.env.VITE_URL}/likes/pending/${penId}`;

        const req = await axios.delete(urlDelete);

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data));
        }

        return true
    } catch (err) {
        handleError(err)
        return false
    }
}

export const handleLikeLikes = async (myId: string, himId: string, penId: string, updateAnkets: () => void, updateVisable?: () => void) => {
    try {
        const req = await axios.put(`${url}/match/like/${himId}`,
            {
                fromId: `${myId}`,
                metch: true
            },
            {
                validateStatus: () => true
            });


        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        const deletePend = await deletePending(penId)

        if (!deletePend) {
            console.error("Произошла ошибка")
        }

        if (updateVisable) {
            updateVisable()
        }

        updateAnkets()
    } catch (err) {
        handleError(err)
    }
}

export const handleDislikeLikes = async (myId: string, himId: string, penId: string, updateAnkets: () => void, updateVisable?: () => void) => {
    try {
        const req = await axios.post(`${url}/redisSearch/dislike/${myId}/${himId}`, {}, {
            validateStatus: () => true
        });

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        const deletePend = await deletePending(penId)

        if (!deletePend) {
            console.error("Произошла ошибка")
        }

        if (updateVisable) {
            updateVisable()
        }
        updateAnkets()
    } catch (err) {
        handleError(err)
    }
}

export const handleReportLikes = async (myId: string, himId: string, penId: string, updateAnkets: () => void) => {
    try {
        const req = await axios.post(`${url}/redisSearch/reported/${myId}/${himId}`, {}, {
            validateStatus: () => true
        });

        if (req.status === 400) {
            throw new Error(JSON.stringify(req.data.message));
        }

        const deletePend = await deletePending(penId)

        if (!deletePend) {
            console.error("Произошла ошибка")
        }

        updateAnkets()
    } catch (err) {
        handleError(err)
    }
}

export const LikeDislikeLikes = ({ himId, penId, updateAnkets }: { himId: string, penId: string, updateAnkets: () => void }) => {
    const { userData } = useTelegram();
    const myId = userData?.id;

    return (
        <div className="flex gap-8 justify-center items-center">
            <div onClick={() => handleLikeLikes(`${myId}`, himId, penId, updateAnkets)}><LikeAnket /></div>
            <div onClick={() => handleReportLikes(`${myId}`, himId, penId, updateAnkets)}><ReportAnket /></div>
            <div onClick={() => handleDislikeLikes(`${myId}`, himId, penId, updateAnkets)} ><DislikeAnket /></div>
        </div>
    )
}
