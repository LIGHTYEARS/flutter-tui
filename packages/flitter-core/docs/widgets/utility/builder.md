# Builder

`来源: src/widgets/builder.ts`

Builder 通过回调函数构建组件树，无需创建 StatelessWidget 子类。适用于内联创建简单组件。

## 构造函数

```typescript
new Builder({
  builder: (context: BuildContext) => Widget,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| builder | `(context: BuildContext) => Widget` | -- | 构建回调函数（必填） |

## 基本用法

```typescript
import { Builder } from 'flitter-core/widgets/builder';

new Builder({
  builder: (context) => {
    return new Text({
      text: new TextSpan({ text: '通过 Builder 创建' }),
    });
  },
})
```

## 进阶用法

### 获取 InheritedWidget 数据

Builder 的一个常见用途是在组件树中创建新的 BuildContext，以便访问上游的 InheritedWidget：

```typescript
new Builder({
  builder: (context) => {
    const style = DefaultTextStyle.of(context);
    return new Text({
      text: new TextSpan({
        text: '使用继承的样式',
        style: style,
      }),
    });
  },
})
```

### 内联条件渲染

```typescript
new Builder({
  builder: (context) => {
    if (isLoading) {
      return label('加载中...');
    }
    return dataWidget;
  },
})
```

::: tip
Builder 本质上就是一个 StatelessWidget，其 `build()` 方法直接调用传入的 `builder` 回调。对于需要状态管理的场景，应使用 StatefulWidget。
:::

## 相关组件

- [LayoutBuilder](/widgets/utility/layout-builder) - 约束感知的构建器
