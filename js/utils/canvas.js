class CanvasUtils {
    constructor(canvas) {
    }

    renderLine(ctx, from, to, color, width) {
        ctx.beginPath();
        ctx.moveTo(from[0], from[1]);
        ctx.lineTo(to[0], to[1]);
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    renderCircle(ctx, position, radius, color) {
        ctx.beginPath();
        ctx.arc(position[0], position[1], radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    }

    renderText(ctx, text, position, alignment = 'center', fontSize = 12) {
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = alignment;
        ctx.textBaseline = "middle";
        ctx.fillText(text, position[0], position[1]);
    }

    renderFromPath2D(ctx, path2D, color) {

    }
}
