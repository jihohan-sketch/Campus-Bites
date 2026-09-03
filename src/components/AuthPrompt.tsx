import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';

import type { RootStackParamList } from '../navigation/types';
import { EmptyState } from './EmptyState';
import { Screen } from './Screen';

interface AuthPromptProps {
  title?: string;
  description?: string;
}

/** Shown on screens that need a signed-in account. */
export function AuthPrompt({
  title = '로그인이 필요해요',
  description = '로그인하면 혼잡도 제보와 친구 추가를 쓸 수 있어요. 급식표는 로그인 없이도 볼 수 있어요.',
}: AuthPromptProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Screen>
      <EmptyState
        emoji="👋"
        title={title}
        description={description}
        actionLabel="로그인 / 가입"
        onAction={() => navigation.navigate('SignIn')}
      />
    </Screen>
  );
}
