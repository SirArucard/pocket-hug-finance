import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, CreditCard, FinanceState, VaultDestinationType } from '@/types/finance';
import { generateInstallmentTransactions, generateId, getCurrentMonth, calculateUsedLimit } from '@/lib/financeUtils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';

// Validation schemas
const transactionSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
  amount: z.number().positive('Valor deve ser positivo').max(1000000000, 'Valor muito alto'),
  category: z.enum([
    'salary', 'extra', 'extra_values', 'food_voucher', 'transport_voucher',
    'fixed_bills', 'food', 'transport', 'health', 'lifestyle', 'vault_withdrawal'
  ], { errorMap: () => ({ message: 'Categoria inválida' }) }),
  type: z.enum(['income', 'expense'], { errorMap: () => ({ message: 'Tipo inválido' }) }),
  paymentType: z.enum(['debit', 'credit', 'food_voucher', 'transport_voucher']).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').refine((date) => {
    const d = new Date(date);
    const now = new Date();
    const minDate = new Date(now.getFullYear() - 10, 0, 1);
    const maxDate = new Date(now.getFullYear() + 10, 11, 31);
    return d >= minDate && d <= maxDate;
  }, 'Data fora do intervalo permitido'),
});

const installmentsSchema = z.number().int().min(1).max(48).optional();

const payInvoiceSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo').max(1000000000, 'Valor muito alto'),
  source: z.enum(['salary', 'vault'], { errorMap: () => ({ message: 'Origem inválida' }) }),
});

const transferSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo').max(1000000000, 'Valor muito alto'),
});

const vaultWithdrawSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo').max(1000000000, 'Valor muito alto'),
  reason: z.string().trim().min(1, 'Motivo é obrigatório').max(200, 'Motivo muito longo'),
  destinationType: z.enum(['INCOME_TRANSFER', 'DIRECT_USE'], { errorMap: () => ({ message: 'Destino inválido' }) }),
});

const creditCardUpdateSchema = z.object({
  limit: z.number().positive().max(1000000000).optional(),
  usedLimit: z.number().min(0).max(1000000000).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  closingDay: z.number().int().min(1).max(31).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  bestBuyDay: z.number().int().min(1).max(31).optional(),
});

const reservePercentageSchema = z.number().int().min(0).max(100);

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
  reason: string | null;
  destination_type: string | null;
}

interface DbCreditCard {
  id: string;
  name: string;
  card_limit: number;
  used_limit: number;
  closing_day: number;
  due_day: number;
  best_buy_day: number;
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
  reason: db.reason ?? undefined,
  destinationType: db.destination_type as VaultDestinationType | undefined,
});

const mapDbToCreditCard = (db: DbCreditCard): CreditCard => ({
  id: db.id,
  name: db.name,
  limit: Number(db.card_limit),
  usedLimit: Number(db.used_limit),
  closingDay: db.closing_day,
  dueDay: db.due_day,
  bestBuyDay: db.best_buy_day,
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
  const { user } = useAuth();

  // Fetch all data on mount or when user changes
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setState({ transactions: [], creditCards: [], reservePercentage: 10 });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const [transactionsRes, creditCardsRes, settingsRes] = await Promise.all([
          supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
          supabase.from('credit_cards').select('*').eq('user_id', user.id),
          supabase.from('settings').select('*').eq('user_id', user.id).limit(1).maybeSingle(),
        ]);

        if (transactionsRes.error) throw transactionsRes.error;
        if (creditCardsRes.error) throw creditCardsRes.error;
        if (settingsRes.error) throw settingsRes.error;

        const transactions = (transactionsRes.data || []).map(mapDbToTransaction);
        let creditCards = (creditCardsRes.data || []).map(mapDbToCreditCard);
        let reservePercentage = settingsRes.data?.reserve_percentage ?? 10;
        
        if (settingsRes.data) {
          setSettingsId(settingsRes.data.id);
        }

        // Create default credit card and settings if they don't exist for new users
        if (creditCards.length === 0) {
          const cardId = generateId();
          const { error } = await supabase.from('credit_cards').insert({
            id: cardId,
            name: 'Cartão Principal',
            card_limit: 5000,
            used_limit: 0,
            closing_day: 15,
            due_day: 25,
            best_buy_day: 7,
            user_id: user.id,
          });
          if (!error) {
            creditCards = [{
              id: cardId,
              name: 'Cartão Principal',
              limit: 5000,
              usedLimit: 0,
              closingDay: 15,
              dueDay: 25,
              bestBuyDay: 7,
            }];
          }
        }

        if (!settingsRes.data) {
          const settingsIdNew = generateId();
          const { error } = await supabase.from('settings').insert({
            id: settingsIdNew,
            reserve_percentage: 10,
            user_id: user.id,
          });
          if (!error) {
            setSettingsId(settingsIdNew);
          }
        }

        // Recalcula o usedLimit dinamicamente baseado nas transações de crédito da fatura atual
        const currentMonth = getCurrentMonth();
        creditCards = creditCards.map((card) => ({
          ...card,
          usedLimit: calculateUsedLimit(transactions, card.bestBuyDay, currentMonth),
        }));

        setState({
          transactions,
          creditCards,
          reservePercentage,
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching data:', error);
        }
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
  }, [toast, user]);

  const addTransaction = useCallback(async (
    transaction: Omit<Transaction, 'id'>,
    installments?: number
  ) => {
    try {
      // Validate transaction input
      const validationResult = transactionSchema.safeParse(transaction);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
        toast({
          title: 'Erro de validação',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      // Validate installments if provided
      if (installments !== undefined) {
        const installmentsResult = installmentsSchema.safeParse(installments);
        if (!installmentsResult.success) {
          toast({
            title: 'Erro de validação',
            description: 'Número de parcelas inválido (1-48)',
            variant: 'destructive',
          });
          return;
        }
      }

      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado para adicionar transações.',
          variant: 'destructive',
        });
        return;
      }

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
          user_id: user.id,
        }));

        const { error } = await supabase.from('transactions').insert(dbTransactions);
        if (error) throw error;

        const newTransactions = [...installmentTransactions, ...state.transactions];
        const currentMonth = getCurrentMonth();
        setState((prev) => ({
          ...prev,
          transactions: newTransactions,
          // Recalcula usedLimit dinamicamente
          creditCards: prev.creditCards.map((card) => ({
            ...card,
            usedLimit: calculateUsedLimit(newTransactions, card.bestBuyDay, currentMonth),
          })),
        }));
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
          user_id: user.id,
        });

        if (error) throw error;

        const newTransactions = [newTransaction, ...state.transactions];
        const currentMonth = getCurrentMonth();
        setState((prev) => ({
          ...prev,
          transactions: newTransactions,
          // Recalcula usedLimit dinamicamente
          creditCards: prev.creditCards.map((card) => ({
            ...card,
            usedLimit: calculateUsedLimit(newTransactions, card.bestBuyDay, currentMonth),
          })),
        }));
      }

      toast({
        title: 'Sucesso',
        description: 'Lançamento adicionado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar lançamento.',
        variant: 'destructive',
      });
    }
  }, [toast, user, state.transactions, state.creditCards]);

  const removeTransaction = useCallback(async (id: string) => {
    try {
      const transaction = state.transactions.find((t) => t.id === id);
      if (!transaction) return;

      const toRemove = transaction.parentId
        ? state.transactions.filter((t) => t.id === id || t.parentId === transaction.parentId)
        : state.transactions.filter((t) => t.id === id || t.parentId === id);

      const idsToRemove = toRemove.map((t) => t.id);

      // Delete from database (cascade will handle related)
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', idsToRemove);

      if (error) throw error;

      const remainingTransactions = state.transactions.filter((t) => !idsToRemove.includes(t.id));
      const currentMonth = getCurrentMonth();
      
      // Recalcula usedLimit dinamicamente
      setState((prev) => ({
        ...prev,
        transactions: remainingTransactions,
        creditCards: prev.creditCards.map((card) => ({
          ...card,
          usedLimit: calculateUsedLimit(remainingTransactions, card.bestBuyDay, currentMonth),
        })),
      }));

      toast({
        title: 'Sucesso',
        description: 'Lançamento removido com sucesso!',
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error removing transaction:', error);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao remover lançamento.',
        variant: 'destructive',
      });
    }
  }, [state.transactions, state.creditCards, toast]);

  const updateCreditCard = useCallback(async (id: string, updates: Partial<CreditCard>) => {
    try {
      // Validate credit card updates
      const validationResult = creditCardUpdateSchema.safeParse(updates);
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
        toast({
          title: 'Erro de validação',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      const dbUpdates: Partial<DbCreditCard> = {};
      if (updates.limit !== undefined) dbUpdates.card_limit = updates.limit;
      if (updates.usedLimit !== undefined) dbUpdates.used_limit = updates.usedLimit;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.closingDay !== undefined) dbUpdates.closing_day = updates.closingDay;
      if (updates.dueDay !== undefined) dbUpdates.due_day = updates.dueDay;
      if (updates.bestBuyDay !== undefined) dbUpdates.best_buy_day = updates.bestBuyDay;

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
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar cartão.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const setReservePercentage = useCallback(async (percentage: number) => {
    try {
      // Validate percentage
      const validationResult = reservePercentageSchema.safeParse(percentage);
      if (!validationResult.success) {
        toast({
          title: 'Erro de validação',
          description: 'Porcentagem deve ser entre 0 e 100',
          variant: 'destructive',
        });
        return;
      }

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
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar porcentagem da reserva.',
        variant: 'destructive',
      });
    }
  }, [settingsId, toast]);

  const payInvoice = useCallback(async (amount: number, source: 'salary' | 'vault') => {
    try {
      // Validate input
      const validationResult = payInvoiceSchema.safeParse({ amount, source });
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
        toast({
          title: 'Erro de validação',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }

      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado.',
          variant: 'destructive',
        });
        return false;
      }

      const card = state.creditCards[0];
      if (!card) return false;

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
        user_id: user.id,
        destination_type: source === 'vault' ? 'INCOME_TRANSFER' : null,
        reason: source === 'vault' ? 'Pagamento de fatura do cartão' : null,
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
            id: transactionId,
            name: `Pagamento Fatura - ${card.name}`,
            amount: amount,
            category: source === 'vault' ? 'vault_withdrawal' : 'fixed_bills',
            type: 'expense',
            paymentType: 'debit',
            date: today,
            destinationType: source === 'vault' ? 'INCOME_TRANSFER' : undefined,
            reason: source === 'vault' ? 'Pagamento de fatura do cartão' : undefined,
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
      toast({
        title: 'Erro',
        description: 'Falha ao pagar fatura.',
        variant: 'destructive',
      });
      return false;
    }
  }, [state.creditCards, toast, user]);

  const transferToVault = useCallback(async (amount: number) => {
    try {
      // Validate input
      const validationResult = transferSchema.safeParse({ amount });
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
        toast({
          title: 'Erro de validação',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }

      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado.',
          variant: 'destructive',
        });
        return false;
      }

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
        user_id: user.id,
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
      toast({
        title: 'Erro',
        description: 'Falha ao transferir para o cofre.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, user]);

  const withdrawFromVault = useCallback(async (amount: number, reason: string, destinationType: VaultDestinationType) => {
    try {
      // Validate input
      const validationResult = vaultWithdrawSchema.safeParse({ amount, reason, destinationType });
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
        toast({
          title: 'Erro de validação',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }

      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado.',
          variant: 'destructive',
        });
        return false;
      }

      const transactionId = generateId();
      const today = new Date().toISOString().split('T')[0];
      
      const transaction = {
        id: transactionId,
        name: `Retirada do Cofre: ${reason}`,
        amount: amount,
        category: 'vault_withdrawal',
        type: 'expense' as const,
        payment_type: 'debit',
        date: today,
        user_id: user.id,
        reason: reason,
        destination_type: destinationType,
      };

      const { error } = await supabase.from('transactions').insert(transaction);
      if (error) throw error;

      setState((prev) => ({
        ...prev,
        transactions: [
          {
            id: transactionId,
            name: `Retirada do Cofre: ${reason}`,
            amount: amount,
            category: 'vault_withdrawal',
            type: 'expense',
            paymentType: 'debit',
            date: today,
            reason: reason,
            destinationType: destinationType,
          } as Transaction,
          ...prev.transactions,
        ],
      }));

      const message = destinationType === 'INCOME_TRANSFER' 
        ? 'Valor retirado do Cofre e adicionado às Entradas!' 
        : 'Valor retirado do Cofre (Uso Direto - não afeta orçamento)!';

      toast({
        title: 'Sucesso',
        description: message,
      });

      return true;
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao retirar do cofre.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, user]);

  return {
    ...state,
    loading,
    addTransaction,
    removeTransaction,
    updateCreditCard,
    setReservePercentage,
    payInvoice,
    transferToVault,
    withdrawFromVault,
  };
};
