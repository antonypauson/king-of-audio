import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(totalSeconds: number): string {
  if (totalSeconds === 0) {
    return "0s";
  }

  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  totalSeconds %= (60 * 60 * 24);
  const hours = Math.floor(totalSeconds / (60 * 60));
  totalSeconds %= (60 * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
    if (hours > 0 && parts.length < 2) { // Add hours if available and less than 2 parts
      parts.push(`${hours}h`);
    }
  } else if (hours > 0) {
    parts.push(`${hours}h`);
    if (minutes > 0 && parts.length < 2) { // Add minutes if available and less than 2 parts
      parts.push(`${minutes}m`);
    }
  } else if (minutes > 0) {
    parts.push(`${minutes}m`);
    if (seconds > 0 && parts.length < 2) { // Add seconds if available and less than 2 parts
      parts.push(`${seconds}s`);
    }
  } else if (seconds > 0) {
    parts.push(`${seconds}s`);
  }

  return parts.join(' ');
}
