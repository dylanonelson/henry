import { createEnum, defineConstant } from 'enumfactory';

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
