import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserContextType {
  isOnboarded: boolean;
  userName: string;
  setUserData: (name: string, onboarded: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedUserName = await AsyncStorage.getItem('twinmind_user_name');
      const savedOnboarded = await AsyncStorage.getItem('twinmind_onboarded');
      
      if (savedUserName && savedOnboarded === 'true') {
        setUserName(savedUserName);
        setIsOnboarded(true);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const setUserData = async (name: string, onboarded: boolean) => {
    try {
      setUserName(name);
      setIsOnboarded(onboarded);
      
      await AsyncStorage.setItem('twinmind_user_name', name);
      await AsyncStorage.setItem('twinmind_onboarded', onboarded.toString());
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  return (
    <UserContext.Provider value={{ isOnboarded, userName, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
