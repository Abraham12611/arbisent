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

interface InterfaceSectionProps {
  control: Control<any>;
}

const CHART_TYPES = ['candlestick', 'line', 'area'];
const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];
const LAYOUTS = ['default', 'compact', 'expanded'];

export function InterfaceSection({ control }: InterfaceSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-medium">Interface Preferences</h4>
        <p className="text-sm text-muted-foreground">
          Customize your trading interface layout and preferences
        </p>
      </div>

      <FormField
        control={control}
        name="interface_preferences.chart_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Chart Type</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  {CHART_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              Choose your preferred chart visualization
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="interface_preferences.default_timeframe"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Default Timeframe</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((timeframe) => (
                    <SelectItem key={timeframe} value={timeframe}>
                      {timeframe}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              Set your default chart timeframe
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="interface_preferences.layout"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Layout</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  {LAYOUTS.map((layout) => (
                    <SelectItem key={layout} value={layout}>
                      {layout.charAt(0).toUpperCase() + layout.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              Choose your preferred layout style
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
}