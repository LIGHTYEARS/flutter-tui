import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Flutter-TUI',
  description: 'Flutter 风格的终端 UI 框架 — TypeScript/Bun',
  lang: 'zh-CN',
  lastUpdated: true,

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '指南', link: '/guide/introduction' },
      { text: 'API 参考', link: '/api/core/types' },
      { text: 'Widget 组件', link: '/widgets/layout/row-column' },
      { text: '示例', link: '/examples/' },
      {
        text: '相关链接',
        items: [
          { text: 'GitHub', link: 'https://github.com/LIGHTYEARS/flutter-tui' },
          { text: 'Bun 运行时', link: 'https://bun.sh' },
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '简介', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '项目结构', link: '/guide/project-structure' },
          ]
        },
        {
          text: '核心概念',
          items: [
            { text: '三棵树架构', link: '/guide/three-tree' },
            { text: 'Widget 生命周期', link: '/guide/widget-lifecycle' },
            { text: '布局系统', link: '/guide/layout-system' },
            { text: '渲染管线', link: '/guide/rendering-pipeline' },
            { text: '状态管理', link: '/guide/state-management' },
          ]
        },
        {
          text: '输入系统',
          items: [
            { text: '键盘事件', link: '/guide/keyboard-input' },
            { text: '鼠标事件', link: '/guide/mouse-input' },
            { text: '焦点管理', link: '/guide/focus-management' },
          ]
        },
      ],
      '/api/': [
        {
          text: '核心类型',
          items: [
            { text: 'Offset / Size / Rect', link: '/api/core/types' },
            { text: 'Color', link: '/api/core/color' },
            { text: 'TextStyle', link: '/api/core/text-style' },
            { text: 'TextSpan', link: '/api/core/text-span' },
            { text: 'BoxConstraints', link: '/api/core/box-constraints' },
            { text: 'Key', link: '/api/core/key' },
            { text: 'EdgeInsets', link: '/api/core/edge-insets' },
          ]
        },
        {
          text: '框架',
          items: [
            { text: 'Widget', link: '/api/framework/widget' },
            { text: 'Element', link: '/api/framework/element' },
            { text: 'RenderObject', link: '/api/framework/render-object' },
            { text: 'BuildOwner', link: '/api/framework/build-owner' },
            { text: 'WidgetsBinding', link: '/api/framework/binding' },
            { text: 'Listenable', link: '/api/framework/listenable' },
          ]
        },
        {
          text: '终端',
          items: [
            { text: 'ScreenBuffer', link: '/api/terminal/screen-buffer' },
            { text: 'Renderer', link: '/api/terminal/renderer' },
            { text: 'ANSI Parser', link: '/api/terminal/ansi-parser' },
          ]
        },
        {
          text: '调度器',
          items: [
            { text: 'FrameScheduler', link: '/api/scheduler/frame-scheduler' },
            { text: 'PaintContext', link: '/api/scheduler/paint-context' },
          ]
        },
        {
          text: '输入',
          items: [
            { text: 'InputEvent', link: '/api/input/events' },
            { text: 'FocusNode', link: '/api/input/focus' },
            { text: 'EventDispatcher', link: '/api/input/event-dispatcher' },
          ]
        },
        {
          text: '诊断',
          items: [
            { text: 'FrameStats', link: '/api/diagnostics/frame-stats' },
            { text: 'PerformanceOverlay', link: '/api/diagnostics/perf-overlay' },
          ]
        },
      ],
      '/widgets/': [
        {
          text: '布局组件',
          items: [
            { text: 'Row / Column', link: '/widgets/layout/row-column' },
            { text: 'Expanded / Flexible', link: '/widgets/layout/expanded-flexible' },
            { text: 'Container', link: '/widgets/layout/container' },
            { text: 'SizedBox', link: '/widgets/layout/sized-box' },
            { text: 'Padding', link: '/widgets/layout/padding' },
            { text: 'Center', link: '/widgets/layout/center' },
            { text: 'Stack / Positioned', link: '/widgets/layout/stack' },
            { text: 'Spacer', link: '/widgets/layout/spacer' },
          ]
        },
        {
          text: '展示组件',
          items: [
            { text: 'Text', link: '/widgets/display/text' },
            { text: 'DefaultTextStyle', link: '/widgets/display/default-text-style' },
            { text: 'DecoratedBox', link: '/widgets/display/decorated-box' },
            { text: 'Divider', link: '/widgets/display/divider' },
            { text: 'Table', link: '/widgets/display/table' },
          ]
        },
        {
          text: '交互组件',
          items: [
            { text: 'TextField', link: '/widgets/input/text-field' },
            { text: 'Button', link: '/widgets/input/button' },
            { text: 'MouseRegion', link: '/widgets/input/mouse-region' },
          ]
        },
        {
          text: '滚动组件',
          items: [
            { text: 'SingleChildScrollView', link: '/widgets/scroll/scroll-view' },
            { text: 'ScrollController', link: '/widgets/scroll/scroll-controller' },
          ]
        },
        {
          text: '工具组件',
          items: [
            { text: 'Builder', link: '/widgets/utility/builder' },
            { text: 'LayoutBuilder', link: '/widgets/utility/layout-builder' },
          ]
        },
      ],
      '/examples/': [
        {
          text: '示例应用',
          items: [
            { text: '总览', link: '/examples/' },
            { text: 'Hello World', link: '/examples/hello-world' },
            { text: '计数器', link: '/examples/counter' },
            { text: '计算器', link: '/examples/calculator' },
            { text: 'Todo 应用', link: '/examples/todo-app' },
            { text: '仪表板', link: '/examples/dashboard' },
            { text: '看板', link: '/examples/kanban-board' },
          ]
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/LIGHTYEARS/flutter-tui' }
    ],

    footer: {
      message: 'Flutter 风格的终端 UI 框架',
      copyright: 'MIT Licensed'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: '本页目录'
    },

    lastUpdated: {
      text: '最后更新'
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    darkModeSwitchLabel: '外观',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '返回顶部',
  },
})
