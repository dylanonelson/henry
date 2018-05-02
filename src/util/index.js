import { createEnum, defineConstant } from 'enumfactory';

function createCidFactory() {
  let factory = null;

  const getter = () => {
    if (factory !== null) {
      return factory;
    }

    let counter = 0;
    const createCid = () => {
      const nextId = `c${counter}`;
      counter += 1;
      return nextId;
    }

    factory = {
      createCid,
    };

    return factory;
  };

  return getter();
}

export const cidFactory = createCidFactory();

export function isNodeType(node, typeName) {
  return (
    (node &&
    typeof typeName === 'string' &&
    node.type.name === typeName) ||
  false);
}

class Status {
  constructor(props) {
    Object.keys(props).forEach(propName => {
      this[propName] = props[propName];
    });
  }

  get id() {
    return this.name();
  }
}

export const itemStatuses = createEnum(
  defineConstant('ACTIVE', {
    icon: 'crop_square',
    text: 'activate',
  }),
  defineConstant('COMPLETE', {
    icon: 'done',
    text: 'complete',
  }),
  defineConstant('DEFERRED', {
    icon: 'access_time',
    text: 'snooze',
  }),
  defineConstant('CANCELED', {
    icon: 'close',
    text: 'cancel',
  }),
)(Status);
