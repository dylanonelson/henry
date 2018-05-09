export { itemStatuses } from './itemStatuses';
export { PromiseWorker } from './PromiseWorker';

export function getKeyValueTuple(obj) {
  if (!obj) {
    return [];
  }
  const [key] = Object.keys(obj);
  return [key, obj[key]];
}

export class Counter {
  constructor(initial = 0) {
    this._value = initial;
  }

  get value() {
    return this._value;
  }

  set value(_value) {
    if (typeof _value === 'number') {
      this._value = _value;
    }
  }

  increment() {
    this.value += 1;
  }
}
