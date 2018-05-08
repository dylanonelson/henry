export { itemStatuses } from './itemStatuses';
export { PromiseWorker } from './PromiseWorker';

export function getKeyValueTuple(obj) {
  if (!obj) {
    return [];
  }
  const [key] = Object.keys(obj);
  return [key, obj[key]];
}

