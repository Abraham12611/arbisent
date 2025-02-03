import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AvatarSection } from "./profile/AvatarSection";
import { EmailPreferencesSection } from "./profile/EmailPreferencesSection";
import { ConnectedWallets } from "./wallet/ConnectedWallets";

const profileFormSchema = z.object({
  username: z.string().min(2).max(30),
  avatar_url: z.string(),
  email_preferences: z.object({
    marketing: z.boolean(),
    trade_alerts: z.boolean(),
    security_notifications: z.boolean(),
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileSettings() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url, email_preferences")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("No profile found");

      return {
        username: profile.username || "",
        avatar_url: profile.avatar_url || "",
        email_preferences: profile.email_preferences as ProfileFormValues["email_preferences"],
      };
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update({
          username: data.username,
          avatar_url: data.avatar_url,
          email_preferences: data.email_preferences,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <AvatarSection form={form} />
          <EmailPreferencesSection form={form} />
          <Button type="submit">Update Profile</Button>
        </form>
      </Form>
      
      <ConnectedWallets />
    </div>
  );
}