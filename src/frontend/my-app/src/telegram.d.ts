export {};

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }

  interface TelegramWebAppUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    allows_write_to_pm?: boolean;
  }

  interface TelegramWebAppInitDataUnsafe {
    user?: TelegramWebAppUser;
    chat?: unknown;
    auth_date?: number;
    hash?: string;
    [key: string]: any;
  }

  interface TelegramWebApp {
    initData: string;
    initDataUnsafe: TelegramWebAppInitDataUnsafe;
    version: string;
    platform: string;
    themeParams: {
      bg_color?: string;
      text_color?: string;
      button_color?: string;
      button_text_color?: string;
    };
    isExpanded: boolean;
    isClosingConfirmationEnabled: boolean;
    expand(): void;
    close(): void;
    ready(): void;
    sendData(data: string): void;
    onEvent(eventType: string, callback: Function): void;
    offEvent(eventType: string, callback: Function): void;
  }
}
