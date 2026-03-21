# BuildOwner

`来源: src/framework/build-owner.ts`

管理 dirty Element 集合和构建作用域。是帧管线中 BUILD 阶段的核心协调者。

## 构造函数

```typescript
new BuildOwner()
```

## 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| isBuilding | `boolean` | 当前是否在构建过程中 |
| dirtyElementCount | `number` | dirty Element 数量 |
| hasDirtyElements | `boolean` | 是否有 dirty Element |
| buildStats | `object` | 构建统计信息（只读副本） |
| globalKeyRegistry | `GlobalKeyRegistry` | GlobalKey 注册表 |

### 构建统计

```typescript
buildStats: {
  totalRebuilds: number;
  elementsRebuiltThisFrame: number;
  maxElementsPerFrame: number;
  averageElementsPerFrame: number;
  lastBuildTime: number;
  averageBuildTime: number;
  maxBuildTime: number;
}
```

统计数据使用 60 帧的滚动窗口计算平均值。

## 方法

### `scheduleBuildFor(element: Element): void`

将 Element 加入 dirty 集合，等待下次构建作用域处理。使用 Set 自动去重。

### `buildScope(callback?: () => void): void`

处理所有 dirty Element，按深度排序（父级先于子级）。

::: tip 级联脏标记处理
使用 `while` 循环处理级联脏标记：重建 Element A 可能标记 Element B 为 dirty，下一次循环迭代会处理 B。
:::

**算法流程：**
1. 执行可选的 callback
2. 快照 dirty 集合并清空
3. 按 depth 升序排序（父级优先）
4. 逐个调用 `element.performRebuild()`，完成后清除 dirty 标志
5. 如果期间产生新的 dirty Element，继续循环

```typescript
// 伪代码
while (dirtyElements.size > 0) {
  const elements = Array.from(dirtyElements);
  dirtyElements.clear();
  elements.sort((a, b) => a.depth - b.depth);
  for (const element of elements) {
    element.performRebuild();
    element._dirty = false;  // 即使出错也清除
  }
}
```

::: warning
即使 `performRebuild()` 抛出异常，dirty 标志也会被清除，防止无限循环。
:::

### `buildScopes(): void`

`buildScope()` 的便捷别名（无回调版本）。

### `dispose(): void`

清理 dirty 集合和 GlobalKey 注册表。

---

## GlobalKeyRegistry

追踪 GlobalKey 到 Element 的映射。

### 方法

| 方法 | 说明 |
|------|------|
| `register(key, element)` | 注册映射（重复注册抛出错误） |
| `unregister(key, element)` | 取消注册 |
| `getElement(key)` | 查找 Element |
| `clear()` | 清空注册表 |
| `size` | 注册的 Key 数量 |

## 示例

```typescript
import { BuildOwner } from './framework/build-owner';

const owner = new BuildOwner();

// 调度 Element 重建
owner.scheduleBuildFor(dirtyElement);

// 执行构建（通常由 WidgetsBinding 在帧管线中调用）
owner.buildScopes();

// 查看构建统计
const stats = owner.buildStats;
console.log(`本帧重建 ${stats.elementsRebuiltThisFrame} 个 Element`);
console.log(`平均构建时间: ${stats.averageBuildTime.toFixed(2)}ms`);
```
