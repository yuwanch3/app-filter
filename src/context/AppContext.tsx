import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import type { FilteredContent, AppConfig, ModerationResult } from '../types';

interface AppState {
  serviceActive: boolean;
  serviceEnabled: boolean;
  permissionsGranted: boolean;
  filteredToday: number;
  config: AppConfig;
  filterHistory: FilteredContent[];
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_SERVICE_ACTIVE'; payload: boolean }
  | { type: 'SET_SERVICE_ENABLED'; payload: boolean }
  | { type: 'SET_PERMISSIONS'; payload: boolean }
  | { type: 'INCREMENT_FILTERED' }
  | { type: 'SET_CONFIG'; payload: Partial<AppConfig> }
  | { type: 'ADD_HISTORY'; payload: FilteredContent }
  | { type: 'SET_HISTORY'; payload: FilteredContent[] }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AppState = {
  serviceActive: false,
  serviceEnabled: false,
  permissionsGranted: false,
  filteredToday: 0,
  config: {
    autoBlur: true,
    requirePinForOverride: false,
    overridePin: '',
    moderationApi: 'local',
    enableKeywordFilter: true,
    enableImageModeration: true,
    enableNotification: true,
    monitoredApps: ['youtube'],
  },
  filterHistory: [],
  isLoading: true,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SERVICE_ACTIVE':
      return { ...state, serviceActive: action.payload };
    case 'SET_SERVICE_ENABLED':
      return { ...state, serviceEnabled: action.payload };
    case 'SET_PERMISSIONS':
      return { ...state, permissionsGranted: action.payload };
    case 'INCREMENT_FILTERED':
      return { ...state, filteredToday: state.filteredToday + 1 };
    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    case 'ADD_HISTORY':
      return {
        ...state,
        filterHistory: [action.payload, ...state.filterHistory].slice(0, 500),
      };
    case 'SET_HISTORY':
      return { ...state, filterHistory: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used within AppProvider');
  return context;
}