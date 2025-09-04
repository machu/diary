import eslintPluginAstro from "eslint-plugin-astro";
import tailwind from "eslint-plugin-tailwindcss";

export default [
  // Ignore generated outputs
  { ignores: ["coverage/**", "dist/**"] },
  // add more generic rule sets here, such as:
  // js.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  ...tailwind.configs["flat/recommended"],
  {
    rules: {
      // override/add rules settings here, such as:
      // "astro/no-set-html-directive": "error"
      "tailwindcss/classnames-order": "off",
      // Allow non-Tailwind classes like Font Awesome
      "tailwindcss/no-custom-classname": "off",
    },
  },
];
