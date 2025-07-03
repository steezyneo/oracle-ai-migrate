
import { NavigateFunction } from 'react-router-dom';

export interface NavigationState {
  activeTab?: string;
  returnTab?: string;
}

export const navigateWithState = (
  navigate: NavigateFunction,
  path: string,
  state: NavigationState
) => {
  navigate(path, { state });
};

export const getReturnTab = (locationState: any, defaultTab: string = 'upload'): string => {
  return locationState?.returnTab || locationState?.activeTab || defaultTab;
};
