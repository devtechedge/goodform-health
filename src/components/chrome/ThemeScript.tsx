import React from "react";

const THEME_BOOT_JS = `(function(){try{var k='goodform_theme';var s=localStorage.getItem(k);var t=(s==='dark'||s==='light')?s:'light';document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: THEME_BOOT_JS }}
      suppressHydrationWarning
    />
  );
}
