import {
  StatefulWidget, State, Widget, BuildContext,
} from 'flitter-core/src/framework/widget';
import { Text } from 'flitter-core/src/widgets/text';
import { TextStyle } from 'flitter-core/src/core/text-style';
import { TextSpan } from 'flitter-core/src/core/text-span';
import { Color } from 'flitter-core/src/core/color';

const PERM_GT = new Uint8Array(512);
(function initPermGT() {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) PERM_GT[i] = p[i & 255];
})();

function noiseGT(x: number): number {
  const xi = Math.floor(x) & 255;
  const xf = x - Math.floor(x);
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
  const a = (PERM_GT[xi] / 255) * 2 - 1;
  const b = (PERM_GT[xi + 1] / 255) * 2 - 1;
  return a + u * (b - a);
}

export interface GlowTextProps {
  text: string;
  baseColor: Color;
  glowColor: Color;
  bold?: boolean;
  glowIntensity?: number;
}

export class GlowText extends StatefulWidget {
  readonly text: string;
  readonly baseColor: Color;
  readonly glowColor: Color;
  readonly bold: boolean;
  readonly glowIntensity: number;

  constructor(props: GlowTextProps) {
    super();
    this.text = props.text;
    this.baseColor = props.baseColor;
    this.glowColor = props.glowColor;
    this.bold = props.bold ?? false;
    this.glowIntensity = props.glowIntensity ?? 0.4;
  }

  createState(): GlowTextState {
    return new GlowTextState();
  }
}

class GlowTextState extends State<GlowText> {
  private timer: ReturnType<typeof setInterval> | null = null;
  private timeOffset = 0;

  override initState(): void {
    super.initState();
    this.timer = setInterval(() => {
      this.setState(() => {
        this.timeOffset += 0.08;
      });
    }, 100);
  }

  override dispose(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    super.dispose();
  }

  build(_context: BuildContext): Widget {
    const { text, baseColor, glowColor, bold, glowIntensity } = this.widget;

    const base = baseColor.toRgb();
    const glow = glowColor.toRgb();

    const spans: TextSpan[] = [];
    for (let i = 0; i < text.length; i++) {
      const n = (noiseGT(i * 0.3 + this.timeOffset) + 1) * 0.5;
      const t = n * glowIntensity;

      const r = Math.round(base.r + (glow.r - base.r) * t);
      const g = Math.round(base.g + (glow.g - base.g) * t);
      const b = Math.round(base.b + (glow.b - base.b) * t);

      spans.push(new TextSpan({
        text: text[i],
        style: new TextStyle({
          foreground: Color.rgb(r, g, b),
          bold,
        }),
      }));
    }

    return new Text({
      text: new TextSpan({ children: spans }),
    });
  }
}
