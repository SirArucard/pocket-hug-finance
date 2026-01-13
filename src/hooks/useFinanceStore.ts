import { useState, useEffect } from 'react';
import { Transaction, CreditCard, FinanceState } from '@/types/finance';
import { generateId, generateInstallmentTransactions } from '@/lib/financeUtils';

const STORAGE_KEY = 'meu-financeiro-data';

const defaultState: FinanceState = {
  transactions: [],
  creditCards: [
    {
      id: generateId(),
      name: 'Cartão Principal',
      limit: 5000,
      usedLimit: 0,
      closingDay: 15,
      dueDay: 25,
      bestBuyDay: 7,
    },
  ],
  reservePercentage: 10,
};

export const useFinanceStore = () => {
  const [state, setState] = useState<FinanceState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultState;
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addTransaction = (
    transaction: Omit<Transaction, 'id'>,
    installments?: number
  ) => {
    if (installments && installments > 1 && transaction.paymentType === 'credit') {
      const installmentTransactions = generateInstallmentTransactions(
        transaction,
        installments
      );
      setState(prev => ({
        ...prev,
        transactions: [...prev.transactions, ...installmentTransactions],
      }));
      
      // Update credit card used limit
      if (transaction.type === 'expense') {
        updateCreditCardUsage(transaction.amount);
      }
    } else {
      const newTransaction: Transaction = {
        ...transaction,
        id: generateId(),
      };
      setState(prev => ({
        ...prev,
        transactions: [...prev.transactions, newTransaction],
      }));
      
      if (transaction.paymentType === 'credit' && transaction.type === 'expense') {
        updateCreditCardUsage(transaction.amount);
      }
    }
  };

  const removeTransaction = (id: string) => {
    setState(prev => {
      const transaction = prev.transactions.find(t => t.id === id);
      const toRemove = transaction?.parentId
        ? prev.transactions.filter(t => t.id === id || t.parentId === transaction.parentId)
        : prev.transactions.filter(t => t.id === id || t.parentId === id);
      
      const totalAmount = toRemove.reduce((sum, t) => sum + t.amount, 0);
      
      // Update credit card if it was a credit transaction
      if (transaction?.paymentType === 'credit') {
        setState(p => ({
          ...p,
          creditCards: p.creditCards.map(card => ({
            ...card,
            usedLimit: Math.max(0, card.usedLimit - totalAmount),
          })),
        }));
      }
      
      return {
        ...prev,
        transactions: prev.transactions.filter(
          t => !toRemove.some(r => r.id === t.id)
        ),
      };
    });
  };

  const updateCreditCardUsage = (amount: number) => {
    setState(prev => ({
      ...prev,
      creditCards: prev.creditCards.map((card, index) =>
        index === 0
          ? { ...card, usedLimit: card.usedLimit + amount }
          : card
      ),
    }));
  };

  const updateCreditCard = (id: string, updates: Partial<CreditCard>) => {
    setState(prev => ({
      ...prev,
      creditCards: prev.creditCards.map(card =>
        card.id === id ? { ...card, ...updates } : card
      ),
    }));
  };

  const setReservePercentage = (percentage: number) => {
    setState(prev => ({
      ...prev,
      reservePercentage: percentage,
    }));
  };

  return {
    ...state,
    addTransaction,
    removeTransaction,
    updateCreditCard,
    setReservePercentage,
  };
};
