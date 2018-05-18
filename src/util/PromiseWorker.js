class PromiseWorker {
  constructor(restartInterval = 1000) {
    this.restartInterval = restartInterval;

    this.interval = null;
    this.errors = [];
    this.task = null;

    this.isWorking = this.isWorking.bind(this);
    this.resolve = this.resolve.bind(this);
    this.tryTask = this.tryTask.bind(this);
  }

  isWorking() {
    return this.task !== null;
  }

  resolve(task) {
    if (this.task !== null) {
      throw new Error('Worker cannot resolve multiple tasks at once');
    }
    this.errors = [];
    this.task = task;
    this.tryTask();
  }

  tryTask() {
    this.task()
      .then(() => {
        this.task = null;
      })
      .catch(e => {
        this.errors.push(e);
        setTimeout(this.tryTask, this.restartInterval);
      });
  }
}

export { PromiseWorker };
