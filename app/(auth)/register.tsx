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
import { RegisterForm, registerSchema } from '../../lib/validation';
import { useAuthStore } from '../../store/useAuthStore';
import { ApiError } from '../../lib/api/client';

export default function Register() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setSubmitting(true);
    setServerError(null);
    try {
      await registerUser(data);
      router.replace('/');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Something went wrong';
      console.warn('[Register] failed:', msg);
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KScreen>
      <KText style={{ fontSize: 56, marginTop: SPACING.lg }}>👋</KText>
      <KText variant="title" style={{ marginTop: SPACING.sm }}>
        Create your account
      </KText>
      <KText variant="body" muted style={{ marginBottom: SPACING.xl }}>
        Start your free 3-day trial
      </KText>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <KInput label="Your name" icon="🙂" value={value} onChangeText={onChange} error={errors.name?.message} />
        )}
      />
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

      <KButton label="Create Account" size="lg" loading={submitting} onPress={handleSubmit(onSubmit)} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg }}>
        <KText muted>Already have an account? </KText>
        <KText color={undefined} onPress={() => router.replace('/(auth)/login')} style={{ fontWeight: '700' }}>
          Log in
        </KText>
      </View>
    </KScreen>
  );
}
