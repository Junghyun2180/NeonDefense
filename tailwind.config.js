/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './dev.html',
    './js/**/*.{js,jsx}',
    './dist/**/*.{js,html}',
  ],
  safelist: [
    // 동적으로 생성되는 클래스 (템플릿 문자열에서)
    { pattern: /^bg-(gray|cyan|orange|purple|red|pink|yellow|green|blue|amber|fuchsia|rose|emerald|indigo|slate)-(50|100|200|300|400|500|600|700|800|900)(\/\d+)?$/ },
    { pattern: /^text-(gray|cyan|orange|purple|red|pink|yellow|green|blue|amber|fuchsia|rose|emerald)-(100|200|300|400|500|600|700|800)$/ },
    { pattern: /^border-(gray|cyan|orange|purple|red|pink|yellow|green|blue|amber|fuchsia|rose|emerald)-(400|500|600)(\/\d+)?$/ },
    { pattern: /^from-(gray|cyan|orange|purple|red|pink|yellow|green|blue|amber|fuchsia|rose|emerald)-(400|500|600|700|800|900)(\/\d+)?$/ },
    { pattern: /^to-(gray|cyan|orange|purple|red|pink|yellow|green|blue|amber|fuchsia|rose|emerald)-(400|500|600|700|800|900)(\/\d+)?$/ },
    { pattern: /^via-(gray|cyan|orange|purple|red|pink|yellow|green|blue|amber|fuchsia|rose|emerald)-(400|500|600|700|800|900)$/ },
    { pattern: /^shadow-(cyan|orange|purple|red|yellow)-(400|500)\/(10|20|30|40|50)$/ },
  ],
  theme: { extend: {} },
  plugins: [],
};
