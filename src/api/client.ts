import { create } from 'axios';

import { config } from '@/src/config/env';

export const apiClient = create({
  baseURL: `${config.supportApiUrl}/api`,
  timeout: 15000,
});

export function setApiAuthToken(token: string | null): void {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}
