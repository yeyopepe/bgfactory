// Reusable corner resize-handle, appended to a positioned host element.
// Standard resize interaction pattern for the app: any element that needs to
// become resizable attaches one of these instead of wiring its own
// mousedown/mousemove/mouseup handling.

export function attachResizeHandle(hostEl, { axis = 'both', getSize, getScale, clamp, onResize, onResizeEnd } = {}) {
  const handle = document.createElement('div');
  handle.className = 'resize-handle';
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
      const deltaX = axis === 'y' ? 0 : (e.clientX - startX) / scale;
      const deltaY = axis === 'x' ? 0 : (e.clientY - startY) / scale;
      const proposed = {
        width: startSize.width + deltaX,
        height: startSize.height + deltaY,
      };
      return clamp ? clamp(proposed) : proposed;
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
