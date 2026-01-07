import { createContext, useContext, useState, ReactNode } from 'react';

interface PrivacyContextType {
  hideIncome: boolean;
  hideAll: boolean;
  toggleHideIncome: () => void;
  toggleHideAll: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const PrivacyProvider = ({ children }: { children: ReactNode }) => {
  const [hideIncome, setHideIncome] = useState(false);
  const [hideAll, setHideAll] = useState(false);

  const toggleHideIncome = () => setHideIncome((prev) => !prev);
  const toggleHideAll = () => setHideAll((prev) => !prev);

  return (
    <PrivacyContext.Provider value={{ hideIncome, hideAll, toggleHideIncome, toggleHideAll }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
};
