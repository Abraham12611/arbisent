import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CoinGeckoTradingService } from "@/services/dex/coingecko-trading.service";

interface TradingPairSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function TradingPairSelect({ value, onValueChange }: TradingPairSelectProps) {
  const [open, setOpen] = useState(false);
  const [pairs, setPairs] = useState<{ symbol: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPairs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const tradingService = CoinGeckoTradingService.getInstance();
        const tradingPairs = await tradingService.getTradingPairs();
        setPairs(tradingPairs);
      } catch (error) {
        console.error("Failed to load trading pairs:", error);
        setError("Failed to load trading pairs. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPairs();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          disabled={isLoading}
        >
          {isLoading ? (
            "Loading pairs..."
          ) : error ? (
            "Error loading pairs"
          ) : value ? (
            value
          ) : (
            "Select pair..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search pair..." />
          <CommandEmpty>No pair found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {pairs.map((pair) => (
              <CommandItem
                key={pair.symbol}
                value={pair.symbol}
                onSelect={(currentValue) => {
                  onValueChange(currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === pair.symbol ? "opacity-100" : "opacity-0"
                  )}
                />
                {pair.symbol}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 