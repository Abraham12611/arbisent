import { Control } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface RiskManagementSectionProps {
  control: Control<any>;
}

export function RiskManagementSection({ control }: RiskManagementSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-medium">Risk Management</h4>
        <p className="text-sm text-muted-foreground">
          Configure your default risk management parameters
        </p>
      </div>

      <FormField
        control={control}
        name="risk_management.default_stop_loss_percentage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Default Stop Loss (%)</FormLabel>
            <FormControl>
              <Slider
                min={1}
                max={20}
                step={0.5}
                value={[field.value]}
                onValueChange={([value]) => field.onChange(value)}
              />
            </FormControl>
            <FormDescription>
              Set your default stop loss percentage
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="risk_management.default_take_profit_percentage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Default Take Profit (%)</FormLabel>
            <FormControl>
              <Slider
                min={1}
                max={50}
                step={0.5}
                value={[field.value]}
                onValueChange={([value]) => field.onChange(value)}
              />
            </FormControl>
            <FormDescription>
              Set your default take profit percentage
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="risk_management.max_position_size_usd"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maximum Position Size (USD)</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={e => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormDescription>
              Set the maximum position size in USD
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
}