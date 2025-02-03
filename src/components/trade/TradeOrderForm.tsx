import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { TradeOrder } from "@/types/trade";

const formSchema = z.object({
  pair: z.string(),
  type: z.enum(["market", "limit"]),
  side: z.enum(["buy", "sell"]),
  amount: z.number().positive(),
  price: z.number().positive().optional(),
  slippage: z.number().min(0.1).max(5),
});

interface TradeOrderFormProps {
  pair?: string;
  initialPrice?: number;
  onSubmit: (data: TradeOrder) => void;
}

export const TradeOrderForm = ({ pair = "", initialPrice, onSubmit }: TradeOrderFormProps) => {
  const [orderType, setOrderType] = useState<"market" | "limit">("market");

  const form = useForm<TradeOrder>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pair,
      type: "market",
      side: "buy",
      amount: 0,
      price: initialPrice,
      slippage: 0.5,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="side"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Order Side</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="buy" id="buy" />
                    <label htmlFor="buy" className="text-arbisent-text">Buy</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sell" id="sell" />
                    <label htmlFor="sell" className="text-arbisent-text">Sell</label>
                  </div>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Order Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value);
                    setOrderType(value as "market" | "limit");
                  }}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="market" id="market" />
                    <label htmlFor="market" className="text-arbisent-text">Market</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="limit" id="limit" />
                    <label htmlFor="limit" className="text-arbisent-text">Limit</label>
                  </div>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.000001"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  className="bg-arbisent-secondary text-arbisent-text"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {orderType === "limit" && (
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limit Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    className="bg-arbisent-secondary text-arbisent-text"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="slippage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slippage Tolerance (%)</FormLabel>
              <FormControl>
                <Slider
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={[field.value]}
                  onValueChange={([value]) => field.onChange(value)}
                  className="w-full"
                />
              </FormControl>
              <div className="text-sm text-arbisent-text/70 mt-1">
                {field.value}%
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-arbisent-accent hover:bg-arbisent-accent/90">
          {form.getValues("side") === "buy" ? "Buy" : "Sell"} {pair}
        </Button>
      </form>
    </Form>
  );
};