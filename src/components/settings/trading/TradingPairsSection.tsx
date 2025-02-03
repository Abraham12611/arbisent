import { Control } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TradingPairsSectionProps {
  control: Control<any>;
}

const AVAILABLE_PAIRS = [
  'BTC/USDT',
  'ETH/USDT',
  'SOL/USDT',
  'AVAX/USDT',
  'BNB/USDT',
  'ADA/USDT',
];

export function TradingPairsSection({ control }: TradingPairsSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-medium">Default Trading Pairs</h4>
        <p className="text-sm text-muted-foreground">
          Select the trading pairs you want to monitor by default
        </p>
      </div>

      <FormField
        control={control}
        name="default_pairs"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Trading Pairs</FormLabel>
            <FormControl>
              <Select 
                value={field.value[0]} 
                onValueChange={(value) => field.onChange([value, ...field.value.slice(1)])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trading pair" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_PAIRS.map((pair) => (
                    <SelectItem key={pair} value={pair}>
                      {pair}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              Choose your primary trading pairs
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
}