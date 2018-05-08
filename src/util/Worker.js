class Worker {
  constructor(restartInterval = 1000) {
    this.restartInterval = restartInterval;
    this.interval = null;
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
    this.task = task;
    this.tryTask();
  }

  tryTask() {
    this.task()
      .then(() => {
        this.task = null;
      })
      .catch(() => {
        setTimeout(this.tryTask, this.restartInterval);
      });
  }
}

export { Worker };
