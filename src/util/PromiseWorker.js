import { createEnum, defineConstant } from 'enumfactory';

const WorkerStatus = createEnum(
  defineConstant('IDLE'),
  defineConstant('TRYING'),
  defineConstant('WAITING'),
)();

class PromiseWorker {
  constructor(restartInterval = 1000) {
    this.restartInterval = restartInterval;

    this.interval = null;
    this.errors = [];
    this.task = null;
    this.status = WorkerStatus.IDLE;

    this.resolve = this.resolve.bind(this);
    this.tryTask = this.tryTask.bind(this);
  }

  resolve(task) {
    if (this.task !== null) {
      throw new Error('Worker cannot resolve multiple tasks at once');
    }
    this.errors = [];
    this.task = task;
  }

  try() {
    if (this.status === WorkerStatus.TRYING) {
      this.promise = this.promise.then(this.tryTask);
    } else if (this.status == WorkerStatus.IDLE) {
      this.tryTask();
    }
  }

  tryTask() {
    this.status = WorkerStatus.TRYING;
    this.promise = this.task().then(() => {
      this.status = WorkerStatus.IDLE;
    })
    .catch(e => {
      this.errors.push(e);
      this.status = WorkerStatus.WAITING;
      setTimeout(this.tryTask, this.restartInterval);
    });
  }
}

export { PromiseWorker };
