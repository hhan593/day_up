# LeetCode 算法刷题攻略

> 综合整理自各大技术社区与力扣官方讨论，适合准备面试的开发者系统学习。

---

## 一、刷题前的准备

在开始刷题之前，确保对以下基础数据结构有清晰理解：

| 基础数据结构 | 核心概念 |
|---|---|
| 数组 / 字符串 | 索引访问、滑动窗口、双指针 |
| 链表 | 单链表、双链表、快慢指针 |
| 栈 / 队列 | LIFO / FIFO、单调栈 |
| 哈希表 | 映射关系、碰撞处理 |
| 树 | 二叉树、BST、前中后序遍历 |
| 图 | 邻接表、DFS、BFS、拓扑排序 |
| 堆 | 最大堆、最小堆、优先队列 |

---

## 二、刷题顺序（推荐路线）

按照「代码随想录」推荐的系统路线：

```
数组 → 链表 → 哈希表 → 字符串 → 栈与队列
  → 树（二叉树/BST/平衡树） → 回溯
  → 贪心 → 动态规划 → 图论 → 高级数据结构
```

### 分轮次策略

| 轮次 | 内容 | 目标 |
|---|---|---|
| 第一轮 | 数学、数组、链表、字符串、哈希表、双指针、递归、栈、队列 | 只做 Easy + 通过率 > 50% 的 Medium |
| 第二轮 | 同上分类 | 做 Medium 级别题目 |
| 第三轮 | 先看理论视频，再刷树、图、回溯、贪心、动态规划 | 理解算法思想 |
| 第四轮 | 困难题 + 通过率 < 40% 的题 | 冲刺提升 |

### 刷题数量参考

- **200 道**：基本满足大多数国内面试
- **400 道**：准备更充分，竞争力更强
- **600 道以上**：国内大厂 Offer 基本都能拿到

---

## 三、核心算法专题与技巧

### 1. 双指针

适用场景：**有序数组或链表中寻找对子、去重、移除元素**

- 单纯一个指针时间复杂度 O(n²)，双指针可降至 O(n)
- 典型题目：两数之和（有序数组）、三数之和、移除元素

```typescript
// 左右双指针模板
function twoSumSorted(nums: number[], target: number): number[] {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const s = nums[left] + nums[right];
    if (s === target) return [left, right];
    else if (s < target) left++;
    else right--;
  }
  return [];
}
```

```rust
// 左右双指针模板
fn two_sum_sorted(nums: &[i32], target: i32) -> Option<(usize, usize)> {
    let (mut left, mut right) = (0, nums.len() - 1);
    while left < right {
        let s = nums[left] + nums[right];
        if s == target { return Some((left, right)); }
        else if s < target { left += 1; }
        else { right -= 1; }
    }
    None
}
```

### 2. 滑动窗口

适用场景：**求最长/最短子串、固定窗口内的统计**

- 输入是线性结构（数组、字符串）
- 用于替代暴力 O(n²) 的嵌套循环

```typescript
// 不定长滑动窗口模板（以最小覆盖子串为例）
function slidingWindow(s: string, need: Map<string, number>): number {
  const window = new Map<string, number>();
  let left = 0, valid = 0, result = Infinity;

  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    window.set(c, (window.get(c) ?? 0) + 1);
    if (need.has(c) && window.get(c) === need.get(c)) valid++;

    while (valid === need.size) {            // 满足条件时收缩
      result = Math.min(result, right - left + 1);
      const d = s[left++];
      if (need.has(d) && window.get(d) === need.get(d)) valid--;
      window.set(d, window.get(d)! - 1);
    }
  }
  return result === Infinity ? 0 : result;
}
```

```rust
// 不定长滑动窗口模板
fn sliding_window(s: &[u8], need: &std::collections::HashMap<u8, usize>) -> usize {
    let mut window: std::collections::HashMap<u8, usize> = Default::default();
    let (mut left, mut valid, mut result) = (0, 0, usize::MAX);

    for right in 0..s.len() {
        let c = s[right];
        *window.entry(c).or_insert(0) += 1;
        if need.get(&c) == window.get(&c) { valid += 1; }

        while valid == need.len() {
            result = result.min(right - left + 1);
            let d = s[left]; left += 1;
            if need.get(&d) == window.get(&d) { valid -= 1; }
            *window.get_mut(&d).unwrap() -= 1;
        }
    }
    if result == usize::MAX { 0 } else { result }
}
```

### 3. 快慢指针

适用场景：**链表中检测环、找中点、判断回文**

```typescript
// 检测链表是否有环
class ListNode {
  val: number;
  next: ListNode | null = null;
  constructor(val: number) { this.val = val; }
}

function hasCycle(head: ListNode | null): boolean {
  let slow = head, fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
```

```rust
// 检测链表是否有环（力扣中用数组模拟，Rust 链表用 Rc<RefCell<>>）
// 竞赛中常用数组 + 下标模拟链表
fn has_cycle(next: &[i32], start: usize) -> bool {
    let (mut slow, mut fast) = (start as i32, start as i32);
    loop {
        slow = next[slow as usize];
        fast = next[next[fast as usize] as usize];
        if fast == -1 { return false; }
        if slow == fast { return true; }
    }
}
```

### 4. 二分查找

适用场景：**有序数组查找、答案具有单调性的最优化问题**

```typescript
// 标准二分查找（左闭右闭）
function binarySearch(nums: number[], target: number): number {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return mid;
    else if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

// 查找左边界（第一个 >= target 的位置）
function lowerBound(nums: number[], target: number): number {
  let left = 0, right = nums.length;
  while (left < right) {
    const mid = (left + right) >> 1;
    if (nums[mid] < target) left = mid + 1;
    else right = mid;
  }
  return left;
}
```

```rust
// 标准二分查找（左闭右闭）
fn binary_search(nums: &[i32], target: i32) -> i32 {
    let (mut left, mut right) = (0i32, nums.len() as i32 - 1);
    while left <= right {
        let mid = left + (right - left) / 2;
        match nums[mid as usize].cmp(&target) {
            std::cmp::Ordering::Equal => return mid,
            std::cmp::Ordering::Less  => left = mid + 1,
            std::cmp::Ordering::Greater => right = mid - 1,
        }
    }
    -1
}

// 查找左边界（第一个 >= target 的位置）
fn lower_bound(nums: &[i32], target: i32) -> usize {
    let (mut left, mut right) = (0, nums.len());
    while left < right {
        let mid = left + (right - left) / 2;
        if nums[mid] < target { left = mid + 1; } else { right = mid; }
    }
    left
}
```

### 5. 回溯算法

适用场景：**全排列、子集、组合、N皇后、数独**

```typescript
// 回溯通用模板（以全排列为例）
function permute(nums: number[]): number[][] {
  const result: number[][] = [];
  const path: number[] = [];
  const used = new Array(nums.length).fill(false);

  function backtrack() {
    if (path.length === nums.length) {
      result.push([...path]);   // 注意拷贝
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;    // 剪枝
      used[i] = true;
      path.push(nums[i]);       // 做选择
      backtrack();
      path.pop();               // 撤销选择
      used[i] = false;
    }
  }

  backtrack();
  return result;
}
```

```rust
// 回溯通用模板（以全排列为例）
fn permute(nums: Vec<i32>) -> Vec<Vec<i32>> {
    let mut result = vec![];
    let mut path = vec![];
    let mut used = vec![false; nums.len()];
    backtrack(&nums, &mut path, &mut used, &mut result);
    result
}

fn backtrack(nums: &[i32], path: &mut Vec<i32>, used: &mut Vec<bool>, result: &mut Vec<Vec<i32>>) {
    if path.len() == nums.len() {
        result.push(path.clone());
        return;
    }
    for i in 0..nums.len() {
        if used[i] { continue; }   // 剪枝
        used[i] = true;
        path.push(nums[i]);        // 做选择
        backtrack(nums, path, used, result);
        path.pop();                // 撤销选择
        used[i] = false;
    }
}
```

**剪枝技巧**：
- 组合问题：`start` 参数控制起始位置，避免重复
- 去重：先排序，跳过同层相同的元素 `if i > start and nums[i] == nums[i-1]: continue`

### 6. 动态规划

适用场景：**最优化问题、计数问题（有重叠子问题、最优子结构）**

**五步法**：
1. 确定 dp 数组的含义
2. 确定递推公式（状态转移方程）
3. dp 数组初始化
4. 确定遍历顺序
5. 举例推导验证

```typescript
// 一维 DP（打家劫舍）
function rob(nums: number[]): number {
  const n = nums.length;
  const dp = new Array(n + 1).fill(0);
  dp[1] = nums[0];
  for (let i = 2; i <= n; i++) {
    dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i - 1]);
  }
  return dp[n];
}

// 0/1 背包
function knapsack01(weights: number[], values: number[], capacity: number): number {
  const dp = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let j = capacity; j >= weights[i]; j--) {   // 逆序（防重用）
      dp[j] = Math.max(dp[j], dp[j - weights[i]] + values[i]);
    }
  }
  return dp[capacity];
}

// 完全背包
function knapsackComplete(weights: number[], values: number[], capacity: number): number {
  const dp = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    for (let j = weights[i]; j <= capacity; j++) {   // 正序（允许重用）
      dp[j] = Math.max(dp[j], dp[j - weights[i]] + values[i]);
    }
  }
  return dp[capacity];
}
```

```rust
// 一维 DP（打家劫舍）
fn rob(nums: Vec<i32>) -> i32 {
    let n = nums.len();
    let mut dp = vec![0i32; n + 1];
    dp[1] = nums[0];
    for i in 2..=n {
        dp[i] = dp[i - 1].max(dp[i - 2] + nums[i - 1]);
    }
    dp[n]
}

// 0/1 背包
fn knapsack_01(weights: &[usize], values: &[i32], capacity: usize) -> i32 {
    let mut dp = vec![0i32; capacity + 1];
    for i in 0..weights.len() {
        for j in (weights[i]..=capacity).rev() {   // 逆序（防重用）
            dp[j] = dp[j].max(dp[j - weights[i]] + values[i]);
        }
    }
    dp[capacity]
}

// 完全背包
fn knapsack_complete(weights: &[usize], values: &[i32], capacity: usize) -> i32 {
    let mut dp = vec![0i32; capacity + 1];
    for i in 0..weights.len() {
        for j in weights[i]..=capacity {           // 正序（允许重用）
            dp[j] = dp[j].max(dp[j - weights[i]] + values[i]);
        }
    }
    dp[capacity]
}
```

### 7. BFS（广度优先搜索）

适用场景：**最短路径、层序遍历、图的连通性**

```typescript
// BFS 模板（图的最短路径）
function bfs(start: number, target: number, graph: Map<number, number[]>): number {
  const queue: [number, number][] = [[start, 0]];
  const visited = new Set([start]);

  while (queue.length) {
    const [node, dist] = queue.shift()!;
    if (node === target) return dist;
    for (const neighbor of (graph.get(node) ?? [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, dist + 1]);
      }
    }
  }
  return -1;
}
```

```rust
// BFS 模板（图的最短路径）
use std::collections::{HashMap, HashSet, VecDeque};

fn bfs(start: usize, target: usize, graph: &HashMap<usize, Vec<usize>>) -> i32 {
    let mut queue = VecDeque::from([(start, 0i32)]);
    let mut visited = HashSet::from([start]);

    while let Some((node, dist)) = queue.pop_front() {
        if node == target { return dist; }
        if let Some(neighbors) = graph.get(&node) {
            for &next in neighbors {
                if visited.insert(next) {
                    queue.push_back((next, dist + 1));
                }
            }
        }
    }
    -1
}
```

### 8. DFS（深度优先搜索）

适用场景：**图的遍历、岛屿问题、路径搜索**

```typescript
// DFS 模板（岛屿问题）
function dfs(grid: string[][], i: number, j: number, visited: boolean[][]): void {
  const rows = grid.length, cols = grid[0].length;
  if (i < 0 || i >= rows || j < 0 || j >= cols) return;
  if (visited[i][j] || grid[i][j] === '0') return;

  visited[i][j] = true;
  dfs(grid, i + 1, j, visited);
  dfs(grid, i - 1, j, visited);
  dfs(grid, i, j + 1, visited);
  dfs(grid, i, j - 1, visited);
}
```

```rust
// DFS 模板（岛屿问题）
fn dfs(grid: &Vec<Vec<char>>, i: usize, j: usize, visited: &mut Vec<Vec<bool>>) {
    let (rows, cols) = (grid.len(), grid[0].len());
    if i >= rows || j >= cols { return; }
    if visited[i][j] || grid[i][j] == '0' { return; }

    visited[i][j] = true;
    if i + 1 < rows { dfs(grid, i + 1, j, visited); }
    if i > 0        { dfs(grid, i - 1, j, visited); }
    if j + 1 < cols { dfs(grid, i, j + 1, visited); }
    if j > 0        { dfs(grid, i, j - 1, visited); }
}
```

### 9. 前缀和

适用场景：**数组区间求和、子数组统计**

```typescript
// 构建前缀和，查询区间 [l, r] 之和（0-indexed）
function buildPrefixSum(nums: number[]) {
  const prefix = new Array(nums.length + 1).fill(0);
  for (let i = 0; i < nums.length; i++) {
    prefix[i + 1] = prefix[i] + nums[i];
  }
  return (l: number, r: number) => prefix[r + 1] - prefix[l];
}
```

```rust
// 构建前缀和，查询区间 [l, r] 之和（0-indexed）
fn build_prefix_sum(nums: &[i32]) -> Vec<i32> {
    let mut prefix = vec![0i32; nums.len() + 1];
    for (i, &v) in nums.iter().enumerate() {
        prefix[i + 1] = prefix[i] + v;
    }
    prefix
}

fn query(prefix: &[i32], l: usize, r: usize) -> i32 {
    prefix[r + 1] - prefix[l]
}
```

### 10. 单调栈

适用场景：**下一个更大/更小元素、柱状图最大矩形**

```typescript
// 求每个元素右侧第一个比它大的元素
function nextGreater(nums: number[]): number[] {
  const result = new Array(nums.length).fill(-1);
  const stack: number[] = [];   // 存索引，栈内元素单调递减

  for (let i = 0; i < nums.length; i++) {
    while (stack.length && nums[i] > nums[stack[stack.length - 1]]) {
      result[stack.pop()!] = nums[i];
    }
    stack.push(i);
  }
  return result;
}
```

```rust
// 求每个元素右侧第一个比它大的元素
fn next_greater(nums: &[i32]) -> Vec<i32> {
    let mut result = vec![-1i32; nums.len()];
    let mut stack: Vec<usize> = vec![];  // 存索引，栈内元素单调递减

    for i in 0..nums.len() {
        while let Some(&top) = stack.last() {
            if nums[i] > nums[top] {
                result[top] = nums[i];
                stack.pop();
            } else { break; }
        }
        stack.push(i);
    }
    result
}
```

---

## 四、各专题刷题建议

### 动态规划（重点，至少100题）

| 子类型 | 代表题目 |
|---|---|
| 线性 DP | 爬楼梯、打家劫舍、最长递增子序列 |
| 背包问题 | 分割等和子集、零钱兑换、完全背包 |
| 区间 DP | 戳气球、石子合并 |
| 树形 DP | 打家劫舍 III、二叉树最大路径和 |
| 状态机 DP | 买卖股票系列 |

### 树（基础必刷）

- 先掌握递归遍历（前/中/后序）
- 再学迭代遍历（用栈模拟）
- 重点：路径问题、LCA、序列化

### 图论

| 算法 | 适用场景 |
|---|---|
| DFS/BFS | 连通分量、最短路（无权图） |
| Dijkstra | 单源最短路（有权图，非负权） |
| 并查集 | 连通性判断、环检测 |
| 拓扑排序 | DAG 依赖关系 |

---

## 五、高效刷题方法论

### 1. 写解题报告（费曼学习法）
刷完一道题后，用自己的话写出：
- 解题思路（为什么用这种算法）
- 关键步骤（边界条件、注意事项）
- 复杂度分析

### 2. 不要死抠一道题
- 思考 15~30 分钟没有思路 → 看题解
- 理解题解后，**关掉题解自己重新写一遍**
- 隔天再写一遍（间隔重复）

### 3. 按专题分类刷
同一类算法题思路相似，集中刷某一专题效率最高。

### 4. 参加每日一题 + 周赛
- 每日一题：保持手感，接触新题型
- 周赛（virtual contest）：锻炼竞技状态和限时思维

### 5. 定期复盘
- **每天**：回顾当天的题，思考是否有更优解
- **每周**：总结本周学到的模板和技巧
- **记录错题**：标记思维盲区，定期回顾

---

## 六、面试时间紧张的速成策略

若准备时间有限（1~2个月），优先刷：

1. **LeetCode HOT 100**：最高频的100道题
2. **LeetCode 面试经典 150 题**：覆盖所有核心知识点
3. **专题突破顺序**：
   - 数组 + 字符串（简单题全做）
   - 链表（全做，不多）
   - 树（BFS + DFS + 递归）
   - 动态规划（至少50题）
   - 回溯（排列/组合/子集三类各10题）

---

## 七、推荐资源

| 资源 | 说明 | 链接 |
|---|---|---|
| 代码随想录 | 最全中文刷题攻略，60万字图解 | [GitHub](https://github.com/youngyangyang04/leetcode-master) |
| doocs/leetcode | 多语言题解（Java/Python/JS等） | [GitHub](https://github.com/doocs/leetcode) |
| 力扣讨论区 | 官方每日一题 + 高质量题解 | [LeetCode CN](https://leetcode.cn/circle/discuss/E3yavq/) |
| azl397985856/leetcode | 图解 + 模板总结 | [GitHub](https://github.com/azl397985856/leetcode) |

---

## 八、心态建议

> 算法刷题没有捷径，只有**不断刷题 → 总结 → 再刷题 → 再总结**的循环。

- Easy 题：争取 100% 正确率
- Medium 题：思考后或与他人交流后能做对即可
- Hard 题：面试很少考，了解思路即可
- **核心**：理解算法思想，而非死记题目答案

---

*整理时间：2026-04-03*
