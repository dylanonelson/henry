import * as dates from './dates';
export { itemStatuses } from './itemStatuses';
export { PromiseWorker } from './PromiseWorker';

export { dates };

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

/**
 * Take the output of Node.toJSON and make sure all objects have the standard
 * Object prototype (instead of null), because that is what Firebase expects.
 */
export function transformObjectPrototypes(obj) {
  if (typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(transformObjectPrototypes);
  }
  return Object.entries(obj).reduce((acc, [k, v]) => {
    acc[k] = transformObjectPrototypes(v);
    return acc;
  }, {});
}
