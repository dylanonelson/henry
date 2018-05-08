export { itemStatuses } from './itemStatuses';
export { Worker } from './Worker';

export function getKeyValueTuple(obj) {
  if (!obj) {
    return [];
  }
  const [key] = Object.keys(obj);
  return [key, obj[key]];
}

