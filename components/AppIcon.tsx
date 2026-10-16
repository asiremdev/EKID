import React, { memo, useEffect, useMemo, useState } from 'react';

import { View, Text, Image, StyleSheet } from 'react-native';

import { AppLockBridge } from '../services/AppLockBridge';



interface AppIconProps {

  appName: string;

  packageName?: string;

  icon?: string | null;

  size?: number;

}



const iconCache = new Map<string, string>();



function nameHue(name: string): number {

  let h = 0;

  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 360;

  return h;

}



export const AppIcon = memo(function AppIcon({

  appName,

  packageName,

  icon,

  size = 44,

}: AppIconProps) {

  const [loadedIcon, setLoadedIcon] = useState<string | null>(

    icon ?? (packageName ? iconCache.get(packageName) ?? null : null)

  );



  useEffect(() => {

    if (icon) {

      setLoadedIcon(icon);

      return;

    }

    if (!packageName) return;



    const cached = iconCache.get(packageName);

    if (cached) {

      setLoadedIcon(cached);

      return;

    }



    let cancelled = false;

    AppLockBridge.getAppIcon(packageName).then((b64) => {

      if (cancelled || !b64) return;

      iconCache.set(packageName, b64);

      setLoadedIcon(b64);

    });



    return () => {

      cancelled = true;

    };

  }, [packageName, icon]);



  const initials = useMemo(() => {

    const parts = appName.trim().split(/\s+/);

    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();

    return appName.slice(0, 2).toUpperCase();

  }, [appName]);



  const hue = useMemo(() => nameHue(appName), [appName]);

  const radius = size * 0.22;



  if (loadedIcon) {

    return (

      <Image

        source={{ uri: `data:image/png;base64,${loadedIcon}` }}

        style={{ width: size, height: size, borderRadius: radius }}

        resizeMode="cover"

      />

    );

  }



  return (

    <View

      style={[

        styles.box,

        {

          width: size,

          height: size,

          borderRadius: radius,

          backgroundColor: `hsl(${hue}, 50%, 38%)`,

        },

      ]}

    >

      <Text style={[styles.text, { fontSize: size * 0.34 }]}>{initials}</Text>

    </View>

  );

});



const styles = StyleSheet.create({

  box: { alignItems: 'center', justifyContent: 'center' },

  text: { color: '#fff', fontWeight: '700' },

});

