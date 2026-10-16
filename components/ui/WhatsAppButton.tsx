import React from 'react';
import { Linking, ViewStyle } from 'react-native';
import { KButton } from './KButton';
import { WHATSAPP_DISPLAY } from '../../constants/billing';

export function WhatsAppButton({
  url,
  label = `WhatsApp ${WHATSAPP_DISPLAY}`,
  style,
}: {
  url: string;
  label?: string;
  style?: ViewStyle;
}) {
  return (
    <KButton
      label={label}
      variant="whatsapp"
      icon="💬"
      size="lg"
      onPress={() => void Linking.openURL(url)}
      style={style}
    />
  );
}
