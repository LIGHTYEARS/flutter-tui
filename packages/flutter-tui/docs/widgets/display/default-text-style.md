# DefaultTextStyle

`来源: src/widgets/default-text-style.ts`

DefaultTextStyle 是一个 InheritedWidget，用于向后代组件提供默认的文本样式。后代 Text 组件可以通过 `DefaultTextStyle.of(context)` 获取最近祖先提供的样式。

## 构造函数

```typescript
new DefaultTextStyle({
  style: TextStyle,
  child: Widget,
  key?: Key,
})
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| style | `TextStyle` | -- | 默认文本样式（必填） |
| child | `Widget` | -- | 子组件树（必填） |

## 静态方法

```typescript
// 获取最近祖先的文本样式，如果没有则返回空 TextStyle
DefaultTextStyle.of(context: BuildContext): TextStyle

// 获取最近祖先的文本样式，如果没有则返回 undefined
DefaultTextStyle.maybeOf(context: BuildContext): TextStyle | undefined
```

## 基本用法

### 为子树提供默认样式

```typescript
import { DefaultTextStyle } from 'flutter-tui/widgets/default-text-style';
import { TextStyle } from 'flutter-tui/core/text-style';
import { Color } from 'flutter-tui/core/color';

// 所有后代文本默认使用粗体绿色
new DefaultTextStyle({
  style: new TextStyle({
    bold: true,
    foreground: Color.green,
  }),
  child: new Column({
    children: [
      label('标题'),     // 继承粗体绿色
      label('副标题'),   // 继承粗体绿色
    ],
  }),
})
```

### 在组件中读取默认样式

```typescript
class MyWidget extends StatelessWidget {
  build(context: BuildContext): Widget {
    const style = DefaultTextStyle.of(context);
    // 使用 style 来决定渲染方式
    return new Text({
      text: new TextSpan({
        text: '使用默认样式',
        style: style,
      }),
    });
  }
}
```

## 进阶用法

### 嵌套覆盖

```typescript
// 外层设置默认样式
new DefaultTextStyle({
  style: new TextStyle({ foreground: Color.white }),
  child: new Column({
    children: [
      label('白色文本'),
      // 内层覆盖为红色
      new DefaultTextStyle({
        style: new TextStyle({ foreground: Color.red }),
        child: label('红色文本'),
      }),
      label('又是白色文本'),
    ],
  }),
})
```

::: info
`updateShouldNotify` 会通过 `TextStyle.equals()` 比较新旧样式，只有样式发生变化时才会通知后代组件重建。
:::

## 相关组件

- [Text](/widgets/display/text) - 文本显示组件
