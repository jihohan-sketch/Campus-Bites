import type { NavigatorScreenParams } from '@react-navigation/native';

import type { Meal } from '../types';

export type MainTabParamList = {
  Meals: undefined;
  Cafeteria: undefined;
  Radar: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  /** Grade/class setup during onboarding or from Profile. School is always VIS. */
  SchoolSetup: { mode: 'onboarding' | 'change' };
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  MealDetail: { meal: Meal };
  CrowdReport: undefined;
  AddFriend: undefined;
  EditProfile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
