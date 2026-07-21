import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import zappIconMap from '@/constants/IconMap';

interface ZappIconProps {
  name: string;
  size?: number;
  color?: string;
  variant?: 'filled' | 'regular' | 'light' | 'duotone' | 'duotone-line';
  style?: any;
}

export default function ZappIcon({
  name,
  size = 24,
  color,
  variant = 'regular',
  style,
}: ZappIconProps) {
  const ZappComponent = zappIconMap[name];

  if (ZappComponent) {
    return <ZappComponent size={size} color={color} variant={variant} style={style} />;
  }

  return <MaterialCommunityIcons name={name as any} size={size} color={color} style={style} />;
}
