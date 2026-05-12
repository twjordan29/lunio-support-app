import Constants from 'expo-constants';

type ExtraConfig = {
  LUNIO_WEB_URL?: string;
  SUPPORT_API_URL?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

export const config = {
  lunioWebUrl: extra.LUNIO_WEB_URL ?? 'https://lunio.ca',
  supportApiUrl: extra.SUPPORT_API_URL ?? 'https://support-api.lunio.ca',
};
