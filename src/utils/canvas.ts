import { Vector2 } from "./vector";

export class CanvasUtils {
  static renderLine(ctx: CanvasRenderingContext2D, from: Vector2, to: Vector2, color: CanvasRenderingContext2D['fillStyle'] = 'red', width = 1) {
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.lineWidth = width;
    ctx.fillStyle = color;
    // ctx.strokeWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  static renderCircle(ctx: CanvasRenderingContext2D, position: Vector2, radius: number, color: CanvasRenderingContext2D['fillStyle'], strokeWidth = 1) {
    ctx.beginPath();
    ctx.arc(position[0], position[1], radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.strokeStyle = 'black';
    // ctx.strokeWidth = strokeWidth;
    ctx.lineWidth = strokeWidth;
    ctx.fill();
    ctx.stroke();
  }

  static renderText(ctx: CanvasRenderingContext2D, text: string, position: Vector2, alignment: CanvasTextAlign = 'center', fontSize = 50, color: CanvasRenderingContext2D['fillStyle'] = 'black') {
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = alignment;
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(text, position[0], position[1]);
  }

  // renderFromPath2D(ctx, path2D, color) {

  // }
}
