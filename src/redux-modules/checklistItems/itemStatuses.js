import { createEnum, defineConstant } from 'enumfactory';

class Status {
  get id() {
    return this.name();
  }
}

export default createEnum(
  defineConstant('CREATED'),
)(Status);
