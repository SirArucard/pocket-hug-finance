import { createContext, useContext, useState, ReactNode } from 'react';

export type PrivacyCategory = 'income' | 'expenses' | 'fixed' | 'balance' | 'vault' | 'vouchers' | 'creditCard';

interface PrivacyContextType {
  hideAll: boolean;
  hiddenCategories: Set<PrivacyCategory>;
  toggleHideAll: () => void;
  toggleCategory: (category: PrivacyCategory) => void;
  isHidden: (category: PrivacyCategory) => boolean;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const PrivacyProvider = ({ children }: { children: ReactNode }) => {
  const [hideAll, setHideAll] = useState(false);
  // Vault starts hidden by default
  const [hiddenCategories, setHiddenCategories] = useState<Set<PrivacyCategory>>(
    new Set(['vault'])
  );

  const toggleHideAll = () => setHideAll((prev) => !prev);

  const toggleCategory = (category: PrivacyCategory) => {
    setHiddenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const isHidden = (category: PrivacyCategory): boolean => {
    return hideAll || hiddenCategories.has(category);
  };

  return (
    <PrivacyContext.Provider value={{ hideAll, hiddenCategories, toggleHideAll, toggleCategory, isHidden }}>
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
