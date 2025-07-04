export const useTelegram = () => {
  const tg = window?.Telegram?.WebApp;

  if (tg) {
    tg.ready();
  }

  const userData = tg?.initDataUnsafe?.user;

  return {
    userData,
    tg,
  };
};
