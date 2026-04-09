# SwarmNote 国际化方案文档

## 技术栈

| 项 | 版本/说明 |
|---|---|
| 框架 | **Lingui v5** (`@lingui/core`, `@lingui/react`) |
| 源语言 | **中文 (zh)** — 字符串直接写在代码中 |
| 翻译语言 | **英文 (en)** — 运行时异步加载 PO 文件 |
| 目录格式 | gettext `.po` |
| 提取命令 | `pnpm lingui extract` |
| 构建集成 | Vite + `@lingui/babel-plugin-lingui-macro` |

---

## 目录结构

```
src/
├── i18n.ts                    # 核心模块：初始化、切换、检测
├── locales/
│   ├── zh/messages.po         # 源语言（msgstr 为空）
│   └── en/messages.po         # 英文翻译
└── stores/
    └── uiStore.ts             # locale 状态 + 持久化
```

---

## 配置

`lingui.config.ts`:

```typescript
import { defineConfig } from "@lingui/cli";

export default defineConfig({
  sourceLocale: "zh",
  locales: ["zh", "en"],
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["src"],
    },
  ],
});
```

`vite.config.ts` 关键部分：

```typescript
import { lingui } from "@lingui/vite-plugin";
import react from "@vitejs/plugin-react";

plugins: [
  react({
    babel: {
      plugins: ["@lingui/babel-plugin-lingui-macro"],
    },
  }),
  lingui(),
]
```

---

## 核心模块 i18n.ts

`src/i18n.ts` 完整实现：

```typescript
import { i18n } from "@lingui/core";

export const locales = { zh: "中文", en: "English" } as const;
export type Locale = keyof typeof locales;

const SOURCE_LOCALE: Locale = "zh";

/** 同步初始化源语言，保证首屏立即渲染 */
export function initI18n() {
  i18n.load(SOURCE_LOCALE, {});
  i18n.activate(SOURCE_LOCALE);
}

/** 切换语言：源语言同步，其他语言异步加载 PO 文件 */
export async function activateLocale(locale: Locale) {
  if (i18n.locale === locale) return;

  if (locale === SOURCE_LOCALE) {
    i18n.load(locale, {});
    i18n.activate(locale);
    return;
  }

  const { messages } = await import(`./locales/${locale}/messages.po`);
  i18n.load(locale, messages);
  i18n.activate(locale);
}

/** 根据浏览器/系统语言自动检测 */
export function detectLocale(): Locale {
  const lang = navigator.language;
  if (lang.startsWith("zh")) return "zh";
  return "en";
}
```

> **移动端适配**：`detectLocale()` 里的 `navigator.language` 换成 React Native 的
> `NativeModules.I18nManager.localeIdentifier` 或 `expo-localization` 的 `Localization.locale`。

---

## 应用入口

`src/main.tsx`:

```typescript
import { initI18n } from "@/i18n";

initI18n(); // 同步初始化，首屏不闪烁

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
```

根组件包裹 Provider（`src/routes/__root.tsx`）：

```typescript
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

function RootComponent() {
  return (
    <I18nProvider i18n={i18n}>
      <Outlet />
    </I18nProvider>
  );
}
```

---

## 组件使用模式

### 模式一：动态文本 — `useLingui()` hook

```typescript
import { useLingui } from "@lingui/react/macro";

function MyComponent() {
  const { t } = useLingui();

  return (
    <button onClick={() => confirm(t`确认删除 "${name}" 吗？`)}>
      {t`删除`}
    </button>
  );
}
```

适用场景：需要将翻译字符串传入函数（toast、confirm dialog、aria-label）。

### 模式二：静态文本 — `<Trans>` 组件

```typescript
import { Trans } from "@lingui/react/macro";

function EmptyState() {
  return (
    <p>
      <Trans>暂无数据</Trans>
    </p>
  );
}
```

适用场景：纯 JSX 渲染，不需要字符串值。

### 模式三：带变量的翻译

```typescript
// 消息："{0}" 已被外部修改。
t`"${relPath}" 已被外部修改。是否重新加载？`
```

PO 文件中的对应项：

```po
#. placeholder {0}: relPath
msgid "\"{0}\" 已被外部修改。是否重新加载？"
msgstr "\"{0}\" was modified externally. Reload?"
```

### 注意：`t` 要放进依赖数组

```typescript
const handleCreate = useCallback(
  async () => {
    await createFile(t`新建笔记`);
  },
  [createFile, t], // t 必须在依赖数组中
);
```

---

## 语言状态管理（Zustand）

`src/stores/uiStore.ts` 关键部分：

```typescript
import { activateLocale, detectLocale, type Locale } from "@/i18n";

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      locale: detectLocale(),

      setLocale: (locale: Locale) => {
        activateLocale(locale).then(
          () => set({ locale }),
          (err) => console.error("Failed to activate locale:", err),
        );
      },
    }),
    {
      name: "swarmnote-ui",
      storage: createJSONStorage(() => AsyncStorage), // 移动端用 AsyncStorage
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        // App 启动时恢复用户上次选择的语言
        if (state) activateLocale(state.locale).catch(console.error);
      },
    },
  ),
);
```

> **移动端适配**：`createTauriStorage` 换成 `AsyncStorage` 或 `expo-secure-store`，
> 其余逻辑完全相同。

---

## 语言切换 UI

```typescript
import { Trans, useLingui } from "@lingui/react/macro";
import { locales, type Locale } from "@/i18n";

function LocaleSelector() {
  const { t } = useLingui();
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);

  return (
    <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
      <SelectItem value="zh">{t`中文`}</SelectItem>
      <SelectItem value="en">English</SelectItem>
    </Select>
  );
}
```

---

## PO 文件格式

`src/locales/en/messages.po` 示例：

```po
msgid ""
msgstr ""
"Content-Type: text/plain; charset=utf-8\n"
"Content-Transfer-Encoding: 8bit\n"
"Language: en\n"

#: src/components/pairing/ConnectionBadge.tsx:40
msgid "中继"
msgstr "Relay"

#. placeholder {0}: event.payload.relPath
#: src/components/editor/NoteEditor.tsx:248
msgid "\"{0}\" 已被外部修改。是否重新加载？当前未保存的编辑将丢失。"
msgstr "\"{0}\" was modified externally. Reload? Unsaved edits will be lost."

# 尚未翻译的项 msgstr 留空
#: src/lib/dateUtils.ts:4
msgid "从未在线"
msgstr ""
```

---

## 工作流

```
1. 编码时：直接用中文写字符串，用 t`...` 或 <Trans>...</Trans> 包裹
2. 提取：pnpm lingui extract  →  自动扫描 src/ 更新 .po 文件
3. 翻译：在 src/locales/en/messages.po 填写 msgstr
4. 构建：Vite 自动打包 .po 文件，运行时按需 import
```

---

## 依赖安装

```bash
# 运行时依赖
pnpm add @lingui/core @lingui/react

# 开发依赖
pnpm add -D @lingui/cli @lingui/babel-plugin-lingui-macro @lingui/vite-plugin
```

---

## 移动端移植检查清单

- [ ] 安装 `@lingui/core` `@lingui/react`（逻辑层完全相同）
- [ ] `@lingui/babel-plugin-lingui-macro` → 配置到 Babel / Metro `babel.config.js`
- [ ] `detectLocale()` → 改用 `expo-localization` 或 RN 原生 API
- [ ] 持久化存储 → `AsyncStorage` / `expo-secure-store` 替换 `createTauriStorage`
- [ ] `I18nProvider` 包裹根组件（和 Web 完全一样）
- [ ] 组件模式（`useLingui` / `Trans`）完全通用，无需修改
- [ ] Metro 需要配置 `.po` 文件的 transformer（或使用 `@lingui/metro-transformer`）
