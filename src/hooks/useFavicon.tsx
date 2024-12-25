import { useEffect } from "react";

function getThemeColors(theme: any): {
  background: string;
  foreground: string;
} {
  const root = document.documentElement;
  root.className = theme;
  const style = getComputedStyle(root);
  const background = style.getPropertyValue("--background").trim();
  const foreground = style.getPropertyValue("--primary").trim();
  const backgroundRGB = hslToRgb(background);
  const foregroundRGB = hslToRgb(foreground);
  return {
    background: rgbToHex(backgroundRGB),
    foreground: rgbToHex(foregroundRGB),
  };
}

function hslToRgb(hsl: string): number[] {
  const [h, s, l] = hsl.split(" ").map(parseFloat);
  const sNormalized = s / 100;
  const lNormalized = l / 100;
  const c = (1 - Math.abs(2 * lNormalized - 1)) * sNormalized;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNormalized - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (0 <= h && h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (60 <= h && h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (120 <= h && h < 180) {
    [r, g, b] = [0, c, x];
  } else if (180 <= h && h < 240) {
    [r, g, b] = [0, x, c];
  } else if (240 <= h && h < 300) {
    [r, g, b] = [x, 0, c];
  } else if (300 <= h && h < 360) {
    [r, g, b] = [c, 0, x];
  }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function rgbToHex(rgb: number[]): string {
  return "#" + rgb.map((x) => x.toString(16).padStart(2, "0")).join("");
}

function generateFavicon(
  text: string,
  backgroundColor: string,
  textColor: string,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, 32, 32);
    // Set text
    ctx.fillStyle = textColor;
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 16, 16);
  }
  return canvas.toDataURL();
}

export function useFavicon(text: string, theme: any) {
  useEffect(() => {
    const { background, foreground } = getThemeColors(theme);
    const faviconUrl = generateFavicon(text, background, foreground);

    let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");

    if (!link) {
      link = document.createElement("link");
      document.head.appendChild(link);
    }

    link.type = "image/x-icon";
    link.rel = "shortcut icon";
    link.href = faviconUrl;
  }, [text, theme]);
}
