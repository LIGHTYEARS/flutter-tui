import {
  StatefulWidget, State, Widget, BuildContext,
} from 'flitter-core/src/framework/widget';
import { Column } from 'flitter-core/src/widgets/flex';
import { Text } from 'flitter-core/src/widgets/text';
import { TextStyle } from 'flitter-core/src/core/text-style';
import { TextSpan } from 'flitter-core/src/core/text-span';
import { Color } from 'flitter-core/src/core/color';
import { AmpThemeProvider } from '../themes/index';

const DOT_COLS = 80;
const DOT_ROWS = 80;
const CELL_COLS = DOT_COLS / 2;
const CELL_ROWS = DOT_ROWS / 4;
const NOISE_SCALE = 0.08;
const NOISE_THRESHOLD = 0.38;

const BRAILLE_DOT_MAP: number[][] = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
];

const PERM = new Uint8Array(512);
const GRAD = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

function initPerm(): void {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
}

initPerm();

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function grad2d(hash: number, x: number, y: number): number {
  const g = GRAD[hash & 7];
  return g[0] * x + g[1] * y;
}

function noise2d(x: number, y: number): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  const u = fade(xf);
  const v = fade(yf);

  const aa = PERM[PERM[xi] + yi];
  const ab = PERM[PERM[xi] + yi + 1];
  const ba = PERM[PERM[xi + 1] + yi];
  const bb = PERM[PERM[xi + 1] + yi + 1];

  const x1 = grad2d(aa, xf, yf) * (1 - u) + grad2d(ba, xf - 1, yf) * u;
  const x2 = grad2d(ab, xf, yf - 1) * (1 - u) + grad2d(bb, xf - 1, yf - 1) * u;

  return x1 * (1 - v) + x2 * v;
}

function fbm(x: number, y: number, octaves: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxAmplitude = 0;

  for (let i = 0; i < octaves; i++) {
    value += noise2d(x * frequency, y * frequency) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return (value / maxAmplitude + 1) * 0.5;
}

export class OrbWidget extends StatefulWidget {
  createState(): OrbWidgetState {
    return new OrbWidgetState();
  }
}

class OrbWidgetState extends State<OrbWidget> {
  private timer: ReturnType<typeof setInterval> | null = null;
  private timeOffset = 0;

  override initState(): void {
    super.initState();
    this.timer = setInterval(() => {
      this.setState(() => {
        this.timeOffset += 0.06;
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

  build(context: BuildContext): Widget {
    const theme = AmpThemeProvider.maybeOf(context);
    const isLight = theme?.base.isLight ?? false;

    const darkR = isLight ? 0 : 0;
    const darkG = isLight ? 140 : 140;
    const darkB = isLight ? 70 : 70;
    const brightR = isLight ? 0 : 0;
    const brightG = isLight ? 200 : 255;
    const brightB = isLight ? 100 : 136;

    const rx = DOT_COLS / 2;
    const ry = DOT_ROWS / 2;

    const rows: Widget[] = [];

    for (let cellRow = 0; cellRow < CELL_ROWS; cellRow++) {
      const spans: TextSpan[] = [];

      for (let cellCol = 0; cellCol < CELL_COLS; cellCol++) {
        let braille = 0;
        let noiseSum = 0;
        let dotCount = 0;

        for (let dr = 0; dr < 4; dr++) {
          for (let dc = 0; dc < 2; dc++) {
            const dotX = cellCol * 2 + dc;
            const dotY = cellRow * 4 + dr;

            const nx = (dotX - rx) / rx;
            const ny = (dotY - ry) / ry;
            const dist = Math.sqrt(nx * nx + ny * ny);

            if (dist > 1) continue;

            const n = fbm(
              dotX * NOISE_SCALE + this.timeOffset,
              dotY * NOISE_SCALE + this.timeOffset * 0.7,
              3,
            );

            const edgeFade = 1 - dist;
            const adjusted = n * edgeFade;

            if (adjusted > NOISE_THRESHOLD) {
              braille |= BRAILLE_DOT_MAP[dr][dc];
              noiseSum += adjusted;
              dotCount++;
            }
          }
        }

        if (braille === 0) {
          spans.push(new TextSpan({ text: ' ' }));
        } else {
          const avg = noiseSum / dotCount;
          const t = Math.min(1, Math.max(0, (avg - NOISE_THRESHOLD) / (1 - NOISE_THRESHOLD)));

          const r = Math.round(darkR + (brightR - darkR) * t);
          const g = Math.round(darkG + (brightG - darkG) * t);
          const b = Math.round(darkB + (brightB - darkB) * t);

          spans.push(new TextSpan({
            text: String.fromCharCode(0x2800 + braille),
            style: new TextStyle({ foreground: Color.rgb(r, g, b) }),
          }));
        }
      }

      rows.push(new Text({
        text: new TextSpan({ children: spans }),
      }));
    }

    return new Column({
      mainAxisSize: 'min',
      crossAxisAlignment: 'center',
      children: rows,
    });
  }
}
