import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth/AuthProvider';
import { AuthProfile } from '@/lib/auth/database';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload } from 'lucide-react';

const profileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email_preferences: z.object({
    notifications: z.boolean(),
    marketing: z.boolean()
  }),
  privacy_settings: z.object({
    showTrades: z.boolean(),
    showProfile: z.boolean()
  }),
  trading_preferences: z.object({
    defaultSlippage: z.number().min(0.1).max(5),
    autoConfirm: z.boolean()
  })
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function UserProfilePage() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.pubkey],
    queryFn: async () => {
      if (!user?.pubkey) throw new Error('No user');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('pubkey', user.pubkey)
        .single();
      
      if (error) throw error;
      return data as AuthProfile;
    },
    enabled: !!user?.pubkey
  });

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile?.username,
      email_preferences: profile?.email_preferences as ProfileFormData['email_preferences'],
      privacy_settings: profile?.privacy_settings as ProfileFormData['privacy_settings'],
      trading_preferences: profile?.trading_preferences as ProfileFormData['trading_preferences']
    }
  });

  const updateProfile = useMutation({
    mutationFn: async (data: Partial<AuthProfile>) => {
      if (!user?.pubkey) throw new Error('No user');
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('pubkey', user.pubkey);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    }
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.pubkey) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.pubkey}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile.mutateAsync({ avatar_url: publicUrl });
      toast.success('Avatar updated successfully');
    } catch (error) {
      toast.error('Failed to upload avatar: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center space-x-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploading}
                className="hidden"
                id="avatar-upload"
              />
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  asChild
                >
                  <span>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Change Avatar'
                    )}
                  </span>
                </Button>
              </Label>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  {...register('username')}
                  error={errors.username?.message}
                />
              </div>
              <div>
                <Label>Public Key</Label>
                <Input value={user?.pubkey} disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-trades">Show Trades</Label>
                <Switch
                  id="show-trades"
                  {...register('privacy_settings.showTrades')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-profile">Public Profile</Label>
                <Switch
                  id="show-profile"
                  {...register('privacy_settings.showProfile')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trading Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="default-slippage">Default Slippage (%)</Label>
                <Input
                  id="default-slippage"
                  type="number"
                  step="0.1"
                  {...register('trading_preferences.defaultSlippage', {
                    valueAsNumber: true
                  })}
                  error={errors.trading_preferences?.defaultSlippage?.message}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-confirm">Auto-confirm Trades</Label>
                <Switch
                  id="auto-confirm"
                  {...register('trading_preferences.autoConfirm')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Trade Notifications</Label>
                <Switch
                  id="notifications"
                  {...register('email_preferences.notifications')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="marketing">Marketing Updates</Label>
                <Switch
                  id="marketing"
                  {...register('email_preferences.marketing')}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!isDirty || updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 