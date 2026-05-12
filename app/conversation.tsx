import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function ConversationLegacyRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/conversations/${id}`} />;
}
