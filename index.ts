type PromiseResolve<T> = (value: T) => void;
type PromiseReject<T> = (reason: T) => void;

type PromiseExecutor<T, K> = (
  resolve: PromiseResolve<T>,
  reject: PromiseReject<K>
) => void;

type PromiseThenCallback<T, U> = (value: T | undefined) => U;
type PromiseCatchCallback<T> = (reason: T | undefined) => void;
type PromiseFinallyCallback = () => void;

enum PromiseState {
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  REJECTED = 'rejected',
}

class CustomPromise<T, K> {
  private state: PromiseState = PromiseState.PENDING;

  private successCallbackHandlers: PromiseThenCallback<T, any>[] = [];
  private failureCallbackHandlers: PromiseCatchCallback<K>[] = [];
  private finallyCallbackHandler: PromiseFinallyCallback | undefined = undefined;

  private value: T | undefined = undefined;
  private reason: K | undefined = undefined;

  constructor(executor: PromiseExecutor<T, K>) {
    try {
      executor(
        this.promiseResolver.bind(this),
        this.promiseRejector.bind(this)
      );
    } catch (error) {
      this.promiseRejector(error as K);
    }
  }

  public then<U>(handlerFn: PromiseThenCallback<T, U>): CustomPromise<U, K> {
    return new CustomPromise<U, K>((resolve, reject) => {
      const wrappedHandler = () => {
        try {
          if (this.state === PromiseState.FULFILLED && handlerFn) {
            const result = handlerFn(this.value);
            if (result instanceof CustomPromise) {
              result.then(resolve).catch(reject);
            } else {
              resolve(result as U);
            }
          } else if (this.state === PromiseState.REJECTED) {
            reject(this.reason as K);
          } else {
            this.successCallbackHandlers.push((value) => {
              try {
                const result = handlerFn(value);
                if (result instanceof CustomPromise) {
                  result.then(resolve).catch(reject);
                } else {
                  resolve(result as U);
                }
              } catch (err) {
                reject(err as K);
              }
            });
          }
        } catch (error) {
          reject(error as K);
        }
      };

      if (this.state !== PromiseState.PENDING) {
        wrappedHandler();
      } else {
        this.successCallbackHandlers.push(() => wrappedHandler());
      }
    });
  }

  public catch(handlerFn: PromiseCatchCallback<K>) {
    if (this.state === PromiseState.REJECTED) {
      handlerFn(this.reason);
    } else {
      this.failureCallbackHandlers.push(handlerFn);
    }
    return this;
  }

  public finally(handlerFn: PromiseFinallyCallback) {
    if (this.state !== PromiseState.PENDING) {
      handlerFn();
    } else {
      this.finallyCallbackHandler = handlerFn;
    }
  }

  private promiseResolver(value: T) {
    if (this.state !== PromiseState.PENDING) return;
    this.state = PromiseState.FULFILLED;
    this.value = value;
    this.successCallbackHandlers.forEach((cb) => cb(value));
    if (this.finallyCallbackHandler) this.finallyCallbackHandler();
  }

  private promiseRejector(reason: K) {
    if (this.state !== PromiseState.PENDING) return;
    this.state = PromiseState.REJECTED;
    this.reason = reason;
    this.failureCallbackHandlers.forEach((cb) => cb(reason));
    if (this.finallyCallbackHandler) this.finallyCallbackHandler();
  }
}
