import { z } from 'zod';

export const UserValidatePUT = z.object({
    name: z.string({ message: 'Поле name должно ялвяться строкой!' }),
    description: z.string({ message: 'Поле description должно ялвяться строкой!' }),
    photo: z.string({ message: 'Поле photo должно ялвяться строкой!' }),
    city: z.string({ message: 'Поле city должно ялвяться строкой!' }),
    age: z.number({ message: 'Поле age должно ялвяться числом!' }),
})

export const UserValidatePOST = z.object({
    name: z.string({ message: 'Поле name должно ялвяться строкой!' }),
    description: z.string({ message: 'Поле description должно ялвяться строкой!' }),
    id: z.string({ message: 'Поле id должно ялвяться строкой!' }),
    photo: z.string({ message: 'Поле photo должно ялвяться строкой!' }),
})