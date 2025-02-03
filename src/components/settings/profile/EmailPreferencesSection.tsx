import { type Control } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import type { ProfileFormValues } from "@/types/preferences";

interface EmailPreferencesSectionProps {
  control: Control<ProfileFormValues>;
}

export function EmailPreferencesSection({ control }: EmailPreferencesSectionProps) {
  return (
    <div className="space-y-4">
      <Label>Email Preferences</Label>
      <FormField
        control={control}
        name="email_preferences.marketing"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Marketing emails</FormLabel>
              <FormDescription>
                Receive emails about new features and updates
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="email_preferences.trade_alerts"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Trade alerts</FormLabel>
              <FormDescription>
                Get notified about important trade events
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="email_preferences.security_notifications"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Security notifications</FormLabel>
              <FormDescription>
                Receive alerts about security events
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}