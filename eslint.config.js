import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Was "off". Stripping per-page shells during the UI rework leaves
      // orphaned imports behind; this catches them without failing the build.
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

      // --- UI rework guard rails ---------------------------------------
      // Design tokens live in src/index.css. Inline hex bypasses them and is
      // how ~50 stray colours accumulated before the rework. Use the Tailwind
      // token classes (bg-primary, text-foreground, ...) instead.
      // TODO(phase-4): flip to "error" once the hex sweep lands.
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "JSXAttribute[name.name='style'] Property > Literal[value=/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/]",
          message:
            "Inline hex colour in a style prop. Use a design token class instead (see src/index.css).",
        },
      ],
      // Sonner is the single toast system. The shadcn stack is being removed.
      // TODO(phase-1): flip to "error" once the 17 useToast call sites migrate.
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "@/hooks/use-toast",
              message: "Use toastError/toastSuccess/toastInfo from @/lib/toast instead.",
            },
            {
              name: "@/components/ui/use-toast",
              message: "Use toastError/toastSuccess/toastInfo from @/lib/toast instead.",
            },
          ],
        },
      ],
    },
  },
);
