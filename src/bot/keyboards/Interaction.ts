export const buttonSaveAgain = {
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: 'Заполнить заново',
                    callback_data: 'again'
                }
            ],
            [
                {
                    text: 'Сохарнить',
                    callback_data: 'save'
                }
            ]
        ]
    }
}

export const buttonNav = {
    reply_markup: {
        keyboard: [
            [
                {
                    text: '👤 Профиль'
                },
                {
                    text: '🔍 Поиск'
                },
                {
                    text: '❤️ Лайки'
                },
                {
                    text: '💌 Метчи'
                }
            ],
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    }
}

export const buttonNavProfile = {
    reply_markup: {
        keyboard: [
            [
                {
                    text: '🔍 Поиск'
                }
            ],
            [
                {
                    text: '👤 Профиль'
                },
                {
                    text: '🥇 Топ'
                }
            ],
            [
                {
                    text: '❤️ Лайки'
                },
                {
                    text: '💌 Метчи'
                }
            ],
            [
                {
                    text: '📦 Кейсы'
                },
                {
                    text: '🛒 Магазин'
                },
                {
                    text: '🔗 Рефералка'
                }
            ],
            [
                {
                    text: '💠 Гемы'
                }
            ]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    }
}

export const buttonEditDelete = {
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: '📝 Изменить анкету',
                    callback_data: 'edit'
                }
            ],
            [
                {
                    text: '⛔️ Выключить анкету',
                    callback_data: 'unplug'
                }
            ]
        ]
    }
};

export const buttonsPremium = {
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: '⭐ Купить премиум на день 250 звезд',
                    callback_data: 'prem_250'
                }
            ],
            [
                {
                    text: '⭐ Купить премиум на неделю 500 звезд',
                    callback_data: 'prem_500'
                }
            ],
            [
                {
                    text: '⭐ Купить премиум на месяц 800 звезд',
                    callback_data: 'prem_800'
                }
            ],
            [
                {
                    text: '⭐ Купить премиум на день 8,000 звезд',
                    callback_data: 'prem_8000'
                }
            ],
            [
                {
                    text: '💠 Купить премиум за 35,000 гемов',
                    callback_data: 'prem_35000_gems'
                }
            ]
        ]
    }
};

export const EditButtons = {
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: '1',
                    callback_data: '1'
                },
                {
                    text: '2',
                    callback_data: '2'
                },
                {
                    text: '3',
                    callback_data: '3'
                }
            ],
            [
                {
                    text: '4',
                    callback_data: '4'
                },
                {
                    text: '5',
                    callback_data: '5'
                },
                {
                    text: '6',
                    callback_data: '6'
                }
            ],
            [
                {
                    text: '7',
                    callback_data: '7'
                },
                {
                    text: '8',
                    callback_data: '8'
                },
                {
                    text: '9',
                    callback_data: '9'
                },
            ],
            [
                {
                    text: '10',
                    callback_data: '10'
                }
            ]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    }
}

export const buttonsGems = {
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: '💠 Купить 10,000 гемов — 50 звезд',
                    callback_data: 'gems_10k'
                }
            ],
            [
                {
                    text: '💠 Купить 100,000 гемов — 450 звезд',
                    callback_data: 'gems_100k'
                }
            ],
            [
                {
                    text: '💠 Купить 500,000 гемов — 1,800 звезд',
                    callback_data: 'gems_500k'
                }
            ],
            [
                {
                    text: '💠 Купить 1,000,000 гемов — 3,200 звезд',
                    callback_data: 'gems_1m'
                }
            ],
        ]
    }
};

export const interactionButtonEdit = (text: string | Boolean) => {
    if (text === true) {
        return false
    } else if (typeof text === "string") {
        return {
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: text
                        }
                    ]
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        }
    }
}
