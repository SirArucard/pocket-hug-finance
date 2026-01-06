import { Utensils, Bus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/financeUtils';

interface VoucherCardsProps {
  foodVoucherBalance: number;
  transportVoucherBalance: number;
}

export const VoucherCards = ({ foodVoucherBalance, transportVoucherBalance }: VoucherCardsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="border-food-voucher/30 bg-gradient-to-br from-food-voucher/10 to-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-food-voucher/20">
              <Utensils className="w-4 h-4 text-food-voucher" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ticket Alimentação</p>
              <p className="text-lg font-bold text-food-voucher">
                {formatCurrency(foodVoucherBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-transport-voucher/30 bg-gradient-to-br from-transport-voucher/10 to-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-transport-voucher/20">
              <Bus className="w-4 h-4 text-transport-voucher" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ticket Mobilidade</p>
              <p className="text-lg font-bold text-transport-voucher">
                {formatCurrency(transportVoucherBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};