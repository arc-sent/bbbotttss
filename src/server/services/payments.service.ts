import { PrismaClient, PaymentType } from "@prisma/client";

interface Body {
    amountStar: number,
    telegramId?: string,
    providerId?: string,
    type: string
}

export class PaymentsService {
    private prisma
    constructor() {
        this.prisma = new PrismaClient();
    }

    async POST(id: string, body: Body) {
        try {
            const newPayload = await this.prisma.payments.create({
                data: {
                    amountStar: body.amountStar,
                    userId: id,
                    type: body.type as PaymentType
                }
            });

            if (!newPayload) {
                throw new Error('Ошибка в создании платежа!');
            }

            return { message: newPayload, status: 200 }
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 }
            } else {
                return { message: `${err}`, status: 400 }
            }
        }
    }

    async GET(id: number) {
        try {
            const getPayments = await this.prisma.payments.findFirst({ where: { invoice_payload: id } });

            if (!getPayments) {
                throw new Error('Ошибка в получении платежа!');
            }

            return { message: getPayments, status: 200 };
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 }
            } else {
                return { message: `${err}`, status: 400 }
            }
        }
    }

    async PUT(id: number, body: Body) {
        try {
            const updateBody = await this.prisma.payments.update({
                where: { invoice_payload: id }, data: {
                    telegramId: body.telegramId,
                    providerId: body.providerId,
                    status: "paid"
                }
            });

            if (!updateBody) {
                throw new Error('Ошибка в обновлении платежа!');
            }

            return { message: updateBody, status: 200 };
        } catch (err) {
            if (err instanceof Error) {
                return { message: `${err.message}`, status: 400 }
            } else {
                return { message: `${err}`, status: 400 }
            }
        }
    }
}