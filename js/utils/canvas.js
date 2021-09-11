class CanvasUtils {
  constructor(canvas) {
  }

  renderLine(ctx, from, to, color, width = 1) {
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.lineWidth = width;
    ctx.fillStyle = color;
    ctx.strokeWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  renderCircle(ctx, position, radius, color = 'black', strokeWidth = 1) {
    ctx.beginPath();
    ctx.arc(position[0], position[1], radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.strokeStyle = 'black';
    ctx.strokeWidth = strokeWidth;
    ctx.lineWidth = strokeWidth;
    ctx.fill();
    ctx.stroke();
  }

  renderText(ctx, text, position, alignment = 'center', fontSize = 50, color = 'black') {
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = alignment;
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(text, position[0], position[1]);
  }

  renderFromPath2D(ctx, path2D, color) {

  }
}
