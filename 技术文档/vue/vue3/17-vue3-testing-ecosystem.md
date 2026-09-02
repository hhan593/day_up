# 17. Vue 3 测试与生态

> 来源可信度：**官方文档确认**（基于 Vue Test Utils、Vitest 官方文档；与 `12-state-pinia.md` 衔接）
> 关联：React `20-testing.md`、Next `19-monitoring.md`

## 1. 测试栈

- **Vitest**：运行器（与 Vite 同源，快）。
- **@vue/test-utils**：挂载组件、触发事件、断言。
- **jsdom**：DOM 环境。
- **@testing-library/vue**：用户视角查询（可选）。

## 2. 组件测试

```ts
import { mount } from '@vue/test-utils';
import Counter from '@/Counter.vue';

test('increments', async () => {
  const w = mount(Counter);
  await w.find('button').trigger('click');
  expect(w.text()).toContain('1');
});
```

- `mount` 渲染、`trigger` 模拟事件、`find`/`findAll` 查询。

## 3. composable 测试

```ts
import { withSetup } from './test-utils';
import { useCounter } from '@/useCounter';

test('counter', () => {
  const [counter] = withSetup(() => useCounter());
  counter.inc();
  expect(counter.n.value).toBe(1);
});
```

- composable 用 `withSetup` 包一层，纯逻辑可脱离组件测。

## 4. Pinia 测试

```ts
import { setActivePinia, createPinia } from 'pinia';
beforeEach(() => setActivePinia(createPinia()));
// 直接测 store
```

- 每个测试重置 Pinia（见 `12-state-pinia.md`）。

## 5. E2E 与生态

- **Playwright/Cypress**：E2E（与 React `20-testing.md` 同）。
- **Vite**：构建/dev（Vue 官方推荐）。
- **Element Plus / Naive UI**：组件库。
- **VueUse**：200+ 实用 composable（`useMouse`/`useFetch`…）。

## 6. 一句话总结

> Vue 测试：Vitest + Vue Test Utils 挂组件/trigger 事件；composable 用 withSetup 纯测；Pinia 每测重置。E2E 用 Playwright，构建用 Vite，工具库用 VueUse。与 React 测试体系思路一致。
