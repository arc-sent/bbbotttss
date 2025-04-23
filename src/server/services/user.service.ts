import { PrismaClient } from "@prisma/client";
import { User, UserPATH, PremiumUser, BodyStatistics, BodyGems, BodyCase } from "../interfaces/user.interface";
import axios from "axios";

export class UserService {
    private prisma;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async GET(id: string) {
        try {
            const findUser = await this.prisma.userBot.findFirst({
                where: { id: id }
            });

            if (!findUser) {
                throw new Error('Error in get user:' + findUser);
            }

            return { message: findUser, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }

    async PUT(body: UserPATH, id: string) {
        try {
            const { name, description, photo, city, age } = body;

            const updateUser = await this.prisma.userBot.update({
                where: { id: id }, data: {
                    name: name,
                    description: description,
                    photo: photo,
                    city: city,
                    age: age
                }
            })

            if (!updateUser) {
                throw new Error('Error in update user');
            }

            return { message: updateUser, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }

    async DELETE(id: string) {
        try {
            const findUser = await this.prisma.userBot.delete({ where: { id: id } });

            if (!findUser) {
                throw new Error('Error in delete user:' + findUser);
            }

            return { message: findUser, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }

    async POST(body: User) {
        try {

            const findUser = await this.GET(body.id);

            if (findUser.status === 200) {
                return { ...findUser, find: true }
            }

            const lengthUserTop = await this.prisma.userBot.count();

            const createUser = await this.prisma.userBot.create({
                data: {
                    name: body.name,
                    description: body.description,
                    id: body.id,
                    photo: body.photo,
                    age: body.age,
                    minAge: body.minAge,
                    maxAge: body.maxAge,
                    city: body.city,
                    lat: Number(body.lat),
                    long: Number(body.lon),
                    top: lengthUserTop,
                    gender: body.gender,
                    searchGender: !body.gender
                }
            });
            console.log("createUser")
            console.log(createUser)

            if (!createUser) {
                throw new Error('Ошибка в создании юзера')
            }

            await this.prisma.$executeRaw`
            UPDATE "UserBot"
            SET location = ST_SetSRID(ST_MakePoint(${createUser.long}, ${createUser.lat}), 4326)
            WHERE "idPrisma" = ${createUser.idPrisma}
          `;


            return { message: createUser, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }

    async PATH(body: UserPATH, id: string) {
        let updateUser
        try {
            if (body.name) {
                updateUser = await this.prisma.userBot.update({
                    where: { id: id }, data: {
                        name: body.name
                    }
                })
            } else if (body.description) {
                updateUser = await this.prisma.userBot.update({
                    where: { id: id }, data: {
                        description: body.description
                    }
                })
            } else if (body.photo) {
                updateUser = await this.prisma.userBot.update({
                    where: { id: id }, data: {
                        photo: body.photo
                    }
                })
            } else if (body.age) {
                updateUser = await this.prisma.userBot.update({
                    where: { id: id }, data: {
                        age: Number(body.age)
                    }
                })
            } else if (body.city) {

                const urlOpenStreet = `https://nominatim.openstreetmap.org/search?q=${body.city}&format=json&limit=1`;
                const reqOpenStreetMap = await axios.get(urlOpenStreet);

                if (reqOpenStreetMap.status === 400) {
                    throw new Error(JSON.stringify(reqOpenStreetMap.data));
                }

                const data = reqOpenStreetMap.data[0];

                const lat = Number(data.lat);
                const lon = Number(data.lon);

                updateUser = await this.prisma.userBot.update({
                    where: { id: id }, data: {
                        city: body.city,
                        lat: lat,
                        long: lon,
                    }
                })
            } else if (body.ageMinMax) {
                updateUser = await this.prisma.userBot.update({
                    where: { id: id }, data: {
                        minAge: body.ageMinMax.minAge,
                        maxAge: body.ageMinMax.maxAge
                    }
                })
            } else {
                throw new Error('Это поле или не сущесвует, или недоступно для обновления!');
            }

            if (!updateUser) {
                throw new Error('Error in update user');
            }

            return { message: updateUser, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }

    async PREMIUM(body: PremiumUser, id: string) {
        try {
            let updateUser;

            if (!body.premium) {
                updateUser = await this.prisma.userBot.update({
                    where: { id: id }, data: {
                        premium: false
                    }
                });
            } else {
                const currentTime = new Date();

                const userPremium = await this.prisma.userBot.findFirst({
                    where: { id: id },
                    select: {
                        premium: true,
                        premiumTime: true
                    }
                });

                if (!userPremium) {
                    throw new Error('Ошибка в получении юзера при подветрежнии премиумма')
                }

                if (body.days == undefined) {
                    throw new Error('Ошибка в получении дней для создания премиума');
                }
                let expiryTime;
                if (userPremium.premium) {
                    if (userPremium.premiumTime) {
                        expiryTime = new Date(userPremium.premiumTime.getTime() + body.days * 24 * 60 * 60 * 1000);
                    } else {
                        expiryTime = new Date(
                            Date.now() + body.days * 24 * 60 * 60 * 1000
                        );
                    }


                } else {
                    expiryTime = new Date(currentTime.getTime() + body.days * 24 * 60 * 60 * 1000);
                }

                updateUser = await this.prisma.userBot.update({
                    where: { id: id }, data: {
                        premium: true,
                        premiumTime: expiryTime
                    }
                });
            }

            if (!updateUser) {
                throw new Error('Ошибка в обновлении статуса премиума у юзера');
            }

            return { message: updateUser, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }

    async STATISTICS(id: string, body: BodyStatistics) {
        let updateStatistics;
        try {
            if (body.like !== undefined) {
                updateStatistics = await this.prisma.userBot.update({
                    where: { id: id }, data: {
                        likeWieved: body.like
                    }
                })
            } else if (body.dislike !== undefined) {
                updateStatistics = await this.prisma.userBot.update({
                    where: { id: id }, data: {
                        dislikeWieved: body.dislike
                    }
                })
            } else if (body.coin !== undefined) {
                updateStatistics = await this.prisma.userBot.update({
                    where: { id: id }, data: {
                        coinWieved: body.coin
                    }
                })
            } else {
                throw new Error('Это поле или не сущесвует, или недоступно для обновления!');
            }

            return { message: updateStatistics, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }

    async GEMS(id: string, body: BodyGems) {
        try {
            const { count, action } = body;

            const updateData: Record<string, any> = {};

            if (action === "increment") {
                updateData.coin = { increment: count };
            } else if (action === "decrement") {
                const user = await this.prisma.userBot.findUnique({
                    where: { id: id },
                    select: { coin: true }
                });

                if (!user || user.coin < count) {
                    throw new Error("Недостаточно средств!");
                }

                updateData.coin = { decrement: count };
            } else {
                return { message: "Некорректное действие!", status: 400 };
            }

            const updatedUser = await this.prisma.userBot.update({
                where: { id: id },
                data: updateData,
            });

            if (!updatedUser) {
                throw new Error("Ошибка в обновлении счета пользователя!");
            }

            return { message: "Успешное обновление счета!", status: 200 };
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 };
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 };
            }
        }
    }

    async CASE(id: string, body: BodyCase) {
        try {
            const { caseType, action } = body;

            const user = await this.prisma.userBot.findFirst({
                where: { id: id },
                select: { [caseType]: true },
            }) as any;

            if (!user) {
                throw new Error("Пользователь не найден");
            }

            if (action === "decrement" && user[caseType] <= 0) {
                throw new Error('Нельзя уменьшить ниже 0')
            }

            const updateData: Record<string, any> = {};
            updateData[caseType] = action === "increment" ? { increment: 1 } : { decrement: 1 };

            const updatedUser = await this.prisma.userBot.update({
                where: { id: id },
                data: updateData,
            });

            return { message: "Кейс обновлён", status: 200 };
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 };
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 };
            }
        }
    }

    async REFERRAL(invited: string, inviting: string) {
        try {
            const invitedUpdate = await this.prisma.userBot.update({
                where: { id: invited }, data: {
                    caseBronza: {
                        increment: 1
                    },
                    caseMystery: {
                        increment: 1
                    },
                    coin: {
                        increment: 5000
                    }
                }
            });

            if (!invitedUpdate) {
                throw Error('Ошибка в обновлении приглашенного юзера');
            }

            const invitingUpdate = await this.prisma.userBot.update({
                where: { id: inviting }, data: {
                    caseGold: {
                        increment: 1
                    },
                    caseMystery: {
                        increment: 1
                    },
                    coin: {
                        increment: 7500
                    }
                }
            });

            if (!invitingUpdate) {
                throw Error('Ошибка в обновлении приглашающего юзера');
            }

            return { message: 'Успешное обновление юзеров!', status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 };
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 };
            }
        }
    }

    async SHUTDOWN(id: string, bool: boolean) {
        try {
            const updateUser = await this.prisma.userBot.update({
                where: { id: id },
                data: {
                    shutdown: bool
                }
            });

            if (!updateUser) {
                throw new Error('Ошибка в отключении анкеты!');
            }

            return { message: 'Успешное отключение анкеты', status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 };
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 };
            }
        }
    }

    async VIEWED(id: string, body: any) {
        try {
            const viewedProfiles = body.map((viewedId: string) => ({
                userId: id,
                viewedId,
            }));

            const updateViewedUser = await this.prisma.viewedProfile.createMany({
                data: viewedProfiles
            });

            if (!updateViewedUser) {
                throw new Error('Ошибка в обновлении просмотренных анкет');
            }

            return { message: 'Успешное обновление бд просмотренных анкет!', status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }

    async TOP(top: number) {
        try {
            const userTop = await this.prisma.userBot.findFirst({
                where: { top: top }
            });

            if (!userTop) {
                throw new Error('Ошибка в получении юзера')
            }

            return { message: userTop, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }

    async GENDER(id: string, body: boolean) {
        try {
            const updateGender = await this.prisma.userBot.update({
                where: { id: id }, data: {
                    gender: body
                }
            });
            console.log('body', body);
            console.log('updateGender', updateGender);

            if (!updateGender) {
                throw new Error('Ошибка в обновлении пола!');
            }

            return { message: 'Успешное обнолвение пола!', status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }

    async EDITGENDER(id: string, body: boolean) {
        try {
            const updateGenderSearch = await this.prisma.userBot.update({
                where: { id: id }, data: {
                    searchGender: body
                }
            });

            if (!updateGenderSearch) {
                throw new Error('Ошибка в обновлении пола!');
            }

            return { message: 'Успешное обнолвение пола поиска!', status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }

    async MANYGET() {
        try {
            const findUsers = await this.prisma.userBot.findMany();

            if (!findUsers) {
                throw new Error('Ошибка со стороны сервера!');
            }

            return { message: findUsers, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `Error: ${err.message}`, status: 400 }
            } else {
                return { message: `Invalid Error: ${err}`, status: 400 }
            }
        }
    }
}