import React from 'react';
import { View } from 'react-native';
import { avatarFor } from '../../constants/design';
import { KText } from './KText';

interface AvatarProps {
  avatarId?: string | null;
  size?: number;
  ring?: boolean;
}

export function Avatar({ avatarId, size = 56, ring = true }: AvatarProps) {
  const avatar = avatarFor(avatarId);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: avatar.color + '33',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 3 : 0,
        borderColor: avatar.color,
      }}
    >
      <KText style={{ fontSize: size * 0.5 }}>{avatar.emoji}</KText>
    </View>
  );
}
