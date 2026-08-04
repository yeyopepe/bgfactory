// Reusable corner resize-handle, appended to a positioned host element.
// Standard resize interaction pattern for the app: any element that needs to
// become resizable attaches one of these instead of wiring its own
// mousedown/mousemove/mouseup handling.
//
// `corner` selects which corner the handle sits on and anchors from:
// - 'br' (default): top-left corner stays fixed, growing extends down-right.
// - 'tl' (cambio 00128): bottom-right corner stays fixed, growing extends
//   up-left. The proposed size still comes out positive/clamped like 'br';
//   in addition, `dx`/`dy` (how far the anchored bottom-right corner would
//   need the element's own x/y shifted to stay put) are included in the
//   object passed to onResize/onResizeEnd, since this module doesn't know
//   about the host's position — only its caller does.
export function attachResizeHandle(hostEl, { axis = 'both', corner = 'br', getSize, getScale, clamp, onResize, onResizeEnd } = {}) {
  const handle = document.createElement('div');
  handle.className = corner === 'tl' ? 'resize-handle resize-handle--tl' : 'resize-handle';
  hostEl.appendChild(handle);

  handle.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = getSize();
    handle.classList.add('resize-handle--active');

    function computeSize(e) {
      const scale = getScale ? getScale() : 1;
      const sign = corner === 'tl' ? -1 : 1;
      const deltaX = axis === 'y' ? 0 : sign * (e.clientX - startX) / scale;
      const deltaY = axis === 'x' ? 0 : sign * (e.clientY - startY) / scale;
      let proposed;
      if (axis === 'both' && e.shiftKey) {
        const delta = Math.abs(deltaX) >= Math.abs(deltaY) ? deltaX : deltaY;
        proposed = {
          width: startSize.width + delta,
          height: startSize.height + delta,
        };
      } else {
        proposed = {
          width: startSize.width + deltaX,
          height: startSize.height + deltaY,
        };
      }
      const clamped = clamp ? clamp(proposed) : proposed;
      if (corner === 'tl') {
        clamped.dx = -(clamped.width - startSize.width);
        clamped.dy = -(clamped.height - startSize.height);
      }
      return clamped;
    }

    function handleMouseMove(e) {
      onResize(computeSize(e));
    }

    function handleMouseUp(e) {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      handle.classList.remove('resize-handle--active');
      if (onResizeEnd) onResizeEnd(computeSize(e));
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });

  return handle;
}
