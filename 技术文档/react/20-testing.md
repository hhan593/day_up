# 20. React 测试（Vitest + Testing Library）

> 来源可信度：**官方文档确认**（基于 React Testing Library、Vitest/Jest 官方文档；与 `14-performance-memo.md` 衔接）

## 1. 工具栈

- **Vitest**（或 Jest）：运行器。
- **@testing-library/react**：以用户视角渲染与查询。
- **jsdom**：模拟 DOM。
- **@testing-library/jest-dom**：匹配器（`toBeInTheDocument`）。

## 2. 渲染 + 查询

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Counter } from './Counter';

test('increments', () => {
  render(<Counter />);
  fireEvent.click(screen.getByText('0'));
  expect(screen.getByText('1')).toBeInTheDocument();
});
```

- 查询优先级：`getByRole` > `getByLabelText` > `getByText` > `getByTestId`（最后手段）。

## 3. 异步与用户事件

```tsx
import userEvent from '@testing-library/user-event';

test('types', async () => {
  render(<Form />);
  await userEvent.type(screen.getByRole('textbox'), 'hi');
  expect(screen.getByDisplayValue('hi')).toBeInTheDocument();
});
```

- `userEvent` 比 `fireEvent` 更真实（触发完整事件序列）。
- 异步用 `findBy*`（`await screen.findByText`）。

## 4. Mock 与 MSW

```tsx
import { http, HttpResponse } from 'msw';
// 用 Mock Service Worker 拦截 fetch，做集成测试
```

- MSW 在网络层 mock，更接近真实；`vi.mock` 在模块层 mock。

## 5. 测试策略金字塔

| 层 | 工具 | 占比 |
|----|------|------|
| 单元 | Vitest + RTL | 多 |
| 集成 | RTL + MSW | 中 |
| E2E | Playwright/Cypress | 少 |

## 6. 一句话总结

> React 测试：Vitest 跑、Testing Library 以用户视角查（`getByRole` 优先）、`userEvent` 模拟真实交互、MSW mock 网络。金字塔：多单元、中集成、少 E2E。
