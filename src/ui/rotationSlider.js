// Control reutilizable de rotación 0-360º con marcas imantadas en los
// múltiplos de 90º. Mismo criterio que ui/resizeHandle.js: lógica genérica
// reutilizada entre varios llamadores (imageAdjustModal.js, cardShapeModal.js,
// cardTextBoxModal.js), sin conocer el modelo de datos del componente/carta.

const SNAP_MARKS = [0, 90, 180, 270, 360];
const ROTATION_SNAP_THRESHOLD_DEG = 8;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function closestMark(value) {
  return SNAP_MARKS.reduce((closest, mark) => (Math.abs(mark - value) < Math.abs(closest - value) ? mark : closest), SNAP_MARKS[0]);
}

export function createRotationSliderField({ label = 'Rotación', value = 0, onChange }) {
  const field = document.createElement('div');
  field.className = 'modal__field rotation-field';

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  field.appendChild(labelEl);

  const wrap = document.createElement('div');
  wrap.className = 'rotation-slider__wrap';
  field.appendChild(wrap);

  const track = document.createElement('div');
  track.className = 'rotation-slider__track';
  wrap.appendChild(track);

  const marksEl = document.createElement('div');
  marksEl.className = 'rotation-slider__marks';
  const markEls = SNAP_MARKS.map(() => {
    const mark = document.createElement('div');
    mark.className = 'rotation-slider__mark';
    marksEl.appendChild(mark);
    return mark;
  });
  track.appendChild(marksEl);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = 0;
  slider.max = 360;
  slider.step = 1;
  slider.value = value;
  track.appendChild(slider);

  const valueBox = document.createElement('div');
  valueBox.className = 'rotation-slider__value';
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.value = value;
  const unit = document.createElement('span');
  unit.textContent = 'º';
  valueBox.appendChild(textInput);
  valueBox.appendChild(unit);
  wrap.appendChild(valueBox);

  const labelsEl = document.createElement('div');
  labelsEl.className = 'rotation-slider__labels';
  for (const mark of SNAP_MARKS) {
    const span = document.createElement('span');
    span.textContent = `${mark}º`;
    labelsEl.appendChild(span);
  }
  field.appendChild(labelsEl);

  function refreshActiveMark(currentValue) {
    const nearest = closestMark(currentValue);
    markEls.forEach((markEl, i) => {
      markEl.classList.toggle('rotation-slider__mark--active', SNAP_MARKS[i] === nearest && Math.abs(nearest - currentValue) <= ROTATION_SNAP_THRESHOLD_DEG);
    });
  }
  refreshActiveMark(value);

  slider.addEventListener('input', () => {
    let raw = parseInt(slider.value, 10);
    const nearest = closestMark(raw);
    if (Math.abs(nearest - raw) <= ROTATION_SNAP_THRESHOLD_DEG) {
      raw = nearest;
      slider.value = raw;
    }
    textInput.value = raw;
    refreshActiveMark(raw);
    if (onChange) onChange(raw);
  });

  function commitTextInput() {
    const parsed = parseInt(textInput.value, 10);
    if (Number.isNaN(parsed)) {
      textInput.value = slider.value;
      return;
    }
    const clamped = clamp(parsed, 0, 360);
    textInput.value = clamped;
    slider.value = clamped;
    refreshActiveMark(clamped);
    if (onChange) onChange(clamped);
  }
  textInput.addEventListener('change', commitTextInput);
  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') textInput.blur();
  });

  function setValue(v) {
    slider.value = v;
    textInput.value = v;
    refreshActiveMark(v);
  }

  return { field, setValue };
}
