import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, CreditCard, FinanceState } from '@/types/finance';
import { generateInstallmentTransactions, generateId } from '@/lib/financeUtils';
import { useToast } from '@/hooks/use-toast';

interface DbTransaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  type: string;
  payment_type: string | null;
  date: string;
  installments: number | null;
  current_installment: number | null;
  parent_id: string | null;
}

interface DbCreditCard {
  id: string;
  name: string;
  card_limit: number;
  used_limit: number;
  closing_day: number;
  due_day: number;
}

interface DbSettings {
  id: string;
  reserve_percentage: number;
}

const mapDbToTransaction = (db: DbTransaction): Transaction => ({
  id: db.id,
  name: db.name,
  amount: Number(db.amount),
  category: db.category as Transaction['category'],
  type: db.type as 'income' | 'expense',
  paymentType: db.payment_type as Transaction['paymentType'],
  date: db.date,
  installments: db.installments ?? undefined,
  currentInstallment: db.current_installment ?? undefined,
  parentId: db.parent_id ?? undefined,
});

const mapDbToCreditCard = (db: DbCreditCard): CreditCard => ({
  id: db.id,
  name: db.name,
  limit: Number(db.card_limit),
  usedLimit: Number(db.used_limit),
  closingDay: db.closing_day,
  dueDay: db.due_day,
});

export const useSupabaseFinance = () => {
  const [state, setState] = useState<FinanceState>({
    transactions: [],
    creditCards: [],
    reservePercentage: 10,
  });
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [transactionsRes, creditCardsRes, settingsRes] = await Promise.all([
          supabase.from('transactions').select('*').order('date', { ascending: false }),
          supabase.from('credit_cards').select('*'),
          supabase.from('settings').select('*').limit(1).maybeSingle(),
        ]);

        if (transactionsRes.error) throw transactionsRes.error;
        if (creditCardsRes.error) throw creditCardsRes.error;
        if (settingsRes.error) throw settingsRes.error;

        const transactions = (transactionsRes.data || []).map(mapDbToTransaction);
        const creditCards = (creditCardsRes.data || []).map(mapDbToCreditCard);
        const reservePercentage = settingsRes.data?.reserve_percentage ?? 10;
        
        if (settingsRes.data) {
          setSettingsId(settingsRes.data.id);
        }

        setState({
          transactions,
          creditCards,
          reservePercentage,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar dados. Por favor, recarregue a página.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const addTransaction = useCallback(async (
    transaction: Omit<Transaction, 'id'>,
    installments?: number
  ) => {
    try {
      if (installments && installments > 1 && transaction.paymentType === 'credit') {
        const installmentTransactions = generateInstallmentTransactions(transaction, installments);
        
        const dbTransactions = installmentTransactions.map((t) => ({
          id: t.id,
          name: t.name,
          amount: t.amount,
          category: t.category,
          type: t.type,
          payment_type: t.paymentType || null,
          date: t.date,
          installments: t.installments || null,
          current_installment: t.currentInstallment || null,
          parent_id: t.parentId || null,
        }));

        const { error } = await supabase.from('transactions').insert(dbTransactions);
        if (error) throw error;

        setState((prev) => ({
          ...prev,
          transactions: [...installmentTransactions, ...prev.transactions],
        }));

        // Update credit card used limit
        if (transaction.type === 'expense') {
          await updateCreditCardUsage(transaction.amount);
        }
      } else {
        const newId = generateId();
        const newTransaction: Transaction = {
          ...transaction,
          id: newId,
        };

        const { error } = await supabase.from('transactions').insert({
          id: newId,
          name: transaction.name,
          amount: transaction.amount,
          category: transaction.category,
          type: transaction.type,
          payment_type: transaction.paymentType || null,
          date: transaction.date,
        });

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          transactions: [newTransaction, ...prev.transactions],
        }));

        if (transaction.paymentType === 'credit' && transaction.type === 'expense') {
          await updateCreditCardUsage(transaction.amount);
        }
      }

      toast({
        title: 'Sucesso',
        description: 'Lançamento adicionado com sucesso!',
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar lançamento.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const removeTransaction = useCallback(async (id: string) => {
    try {
      const transaction = state.transactions.find((t) => t.id === id);
      if (!transaction) return;

      const toRemove = transaction.parentId
        ? state.transactions.filter((t) => t.id === id || t.parentId === transaction.parentId)
        : state.transactions.filter((t) => t.id === id || t.parentId === id);

      const idsToRemove = toRemove.map((t) => t.id);
      const totalAmount = toRemove.reduce((sum, t) => sum + t.amount, 0);

      // Delete from database (cascade will handle related)
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', idsToRemove);

      if (error) throw error;

      // Update credit card if it was a credit transaction
      if (transaction.paymentType === 'credit') {
        const card = state.creditCards[0];
        if (card) {
          const newUsedLimit = Math.max(0, card.usedLimit - totalAmount);
          await supabase
            .from('credit_cards')
            .update({ used_limit: newUsedLimit })
            .eq('id', card.id);

          setState((prev) => ({
            ...prev,
            transactions: prev.transactions.filter((t) => !idsToRemove.includes(t.id)),
            creditCards: prev.creditCards.map((c) =>
              c.id === card.id ? { ...c, usedLimit: newUsedLimit } : c
            ),
          }));
        }
      } else {
        setState((prev) => ({
          ...prev,
          transactions: prev.transactions.filter((t) => !idsToRemove.includes(t.id)),
        }));
      }

      toast({
        title: 'Sucesso',
        description: 'Lançamento removido com sucesso!',
      });
    } catch (error) {
      console.error('Error removing transaction:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover lançamento.',
        variant: 'destructive',
      });
    }
  }, [state.transactions, state.creditCards, toast]);

  const updateCreditCardUsage = useCallback(async (amount: number) => {
    const card = state.creditCards[0];
    if (!card) return;

    const newUsedLimit = card.usedLimit + amount;

    const { error } = await supabase
      .from('credit_cards')
      .update({ used_limit: newUsedLimit })
      .eq('id', card.id);

    if (error) {
      console.error('Error updating credit card:', error);
      return;
    }

    setState((prev) => ({
      ...prev,
      creditCards: prev.creditCards.map((c, index) =>
        index === 0 ? { ...c, usedLimit: newUsedLimit } : c
      ),
    }));
  }, [state.creditCards]);

  const updateCreditCard = useCallback(async (id: string, updates: Partial<CreditCard>) => {
    try {
      const dbUpdates: Partial<DbCreditCard> = {};
      if (updates.limit !== undefined) dbUpdates.card_limit = updates.limit;
      if (updates.usedLimit !== undefined) dbUpdates.used_limit = updates.usedLimit;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.closingDay !== undefined) dbUpdates.closing_day = updates.closingDay;
      if (updates.dueDay !== undefined) dbUpdates.due_day = updates.dueDay;

      const { error } = await supabase
        .from('credit_cards')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setState((prev) => ({
        ...prev,
        creditCards: prev.creditCards.map((card) =>
          card.id === id ? { ...card, ...updates } : card
        ),
      }));
    } catch (error) {
      console.error('Error updating credit card:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar cartão.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const setReservePercentage = useCallback(async (percentage: number) => {
    try {
      if (settingsId) {
        const { error } = await supabase
          .from('settings')
          .update({ reserve_percentage: percentage })
          .eq('id', settingsId);

        if (error) throw error;
      }

      setState((prev) => ({
        ...prev,
        reservePercentage: percentage,
      }));
    } catch (error) {
      console.error('Error updating reserve percentage:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar porcentagem da reserva.',
        variant: 'destructive',
      });
    }
  }, [settingsId, toast]);

  const payInvoice = useCallback(async (amount: number, source: 'salary' | 'vault') => {
    try {
      const card = state.creditCards[0];
      if (!card) return;

      // Create a transaction for the payment
      const transactionId = generateId();
      const today = new Date().toISOString().split('T')[0];
      
      const transaction = {
        id: transactionId,
        name: `Pagamento Fatura - ${card.name}`,
        amount: amount,
        category: source === 'vault' ? 'vault_withdrawal' : 'fixed_bills',
        type: 'expense' as const,
        payment_type: 'debit',
        date: today,
      };

      const { error: transError } = await supabase.from('transactions').insert(transaction);
      if (transError) throw transError;

      // Reset used limit
      const newUsedLimit = Math.max(0, card.usedLimit - amount);
      const { error: cardError } = await supabase
        .from('credit_cards')
        .update({ used_limit: newUsedLimit })
        .eq('id', card.id);

      if (cardError) throw cardError;

      setState((prev) => ({
        ...prev,
        transactions: [
          {
            ...transaction,
            paymentType: 'debit',
          } as Transaction,
          ...prev.transactions,
        ],
        creditCards: prev.creditCards.map((c) =>
          c.id === card.id ? { ...c, usedLimit: newUsedLimit } : c
        ),
      }));

      toast({
        title: 'Sucesso',
        description: `Fatura paga com ${source === 'vault' ? 'Cofre' : 'Salário'}!`,
      });

      return true;
    } catch (error) {
      console.error('Error paying invoice:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao pagar fatura.',
        variant: 'destructive',
      });
      return false;
    }
  }, [state.creditCards, toast]);

  const transferToVault = useCallback(async (amount: number) => {
    try {
      const transactionId = generateId();
      const today = new Date().toISOString().split('T')[0];
      
      const transaction = {
        id: transactionId,
        name: 'Transferência para Reserva (Cofre)',
        amount: amount,
        category: 'extra',
        type: 'income' as const,
        payment_type: null,
        date: today,
      };

      const { error } = await supabase.from('transactions').insert(transaction);
      if (error) throw error;

      setState((prev) => ({
        ...prev,
        transactions: [
          {
            id: transactionId,
            name: 'Transferência para Reserva (Cofre)',
            amount: amount,
            category: 'extra',
            type: 'income',
            date: today,
          } as Transaction,
          ...prev.transactions,
        ],
      }));

      toast({
        title: 'Sucesso',
        description: 'Valor transferido para o Cofre!',
      });

      return true;
    } catch (error) {
      console.error('Error transferring to vault:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao transferir para o cofre.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  return {
    ...state,
    loading,
    addTransaction,
    removeTransaction,
    updateCreditCard,
    setReservePercentage,
    payInvoice,
    transferToVault,
  };
};
