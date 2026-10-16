import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { KInput } from '../../components/ui/KInput';
import { KButton } from '../../components/ui/KButton';
import { SPACING } from '../../constants/theme';
import { LoginForm, loginSchema } from '../../lib/validation';
import { useAuthStore } from '../../store/useAuthStore';
import { ApiError } from '../../lib/api/client';

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setSubmitting(true);
    setServerError(null);
    try {
      await login(data);
      router.replace('/');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Something went wrong';
      console.warn('[Login] failed:', msg);
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KScreen>
      <KText style={{ fontSize: 56, marginTop: SPACING.lg }}>🌟</KText>
      <KText variant="title" style={{ marginTop: SPACING.sm }}>
        Welcome back
      </KText>
      <KText variant="body" muted style={{ marginBottom: SPACING.xl }}>
        Log in to continue
      </KText>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <KInput
            label="Email"
            icon="✉️"
            autoCapitalize="none"
            keyboardType="email-address"
            value={value}
            onChangeText={onChange}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <KInput
            label="Password"
            icon="🔒"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            error={errors.password?.message}
          />
        )}
      />

      {serverError ? (
        <KText variant="caption" color="#CF6679" style={{ marginBottom: SPACING.sm }}>
          {serverError}
        </KText>
      ) : null}

      <KButton label="Log In" size="lg" loading={submitting} onPress={handleSubmit(onSubmit)} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg }}>
        <KText muted>New here? </KText>
        <KText onPress={() => router.replace('/(auth)/register')} style={{ fontWeight: '700' }}>
          Create an account
        </KText>
      </View>
    </KScreen>
  );
}
