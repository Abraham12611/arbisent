import { type Control } from "react-hook-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { ProfileFormValues } from "@/types/preferences";

interface AvatarSectionProps {
  control: Control<ProfileFormValues>;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  username: string;
}

export function AvatarSection({ control, onAvatarChange, username }: AvatarSectionProps) {
  return (
    <FormField
      control={control}
      name="avatar_url"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Profile Picture</FormLabel>
          <FormControl>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={field.value} />
                <AvatarFallback>
                  {username?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={onAvatarChange}
                  className="w-full"
                />
                <FormDescription>
                  Upload a new profile picture (max 2MB)
                </FormDescription>
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}