# Custom Implementation of a Promise Class (CustomPromise) in TypeScript

The CustomPromise class is a custom implementation of the JavaScript Promise object, designed to facilitate structured handling of asynchronous operations. It adheres to the core behavior of native Promises while providing an educational look into their inner workings.




## OverView

The CustomPromise class allows developers to handle asynchronous tasks through methods like then, catch, and finally. Its key functionalities include:

State Management: Tracks the state of the promise (pending, fulfilled, or rejected).

Callback Registration: Supports chaining of multiple then calls and error handling with catch.

Chaining Support: Ensures seamless chaining of asynchronous tasks.
## Class Structure
Class Structure

1. Constructor

The constructor initializes the state, value, and handlers for the promise. It accepts an executor function that defines the asynchronous operation.

constructor(executor: PromiseExecutor<T, K>) {
  this.state = PromiseState.PENDING; // Initial state of the promise
  this.value = undefined;           // Holds the resolved value
  this.reason = undefined;          // Holds the rejection reason
  this.successCallbackHandlers = []; // Queue for `then` callbacks
  this.failureCallbackHandlers = []; // Queue for `catch` callbacks
  this.finallyCallbackHandler = undefined; // Handler for `finally`

  // Define internal resolve and reject functions
  const resolve = (value: T) => this.promiseResolver(value);
  const reject = (reason: K) => this.promiseRejector(reason);

  try {
    executor(resolve, reject); // Execute the provided executor function
  } catch (error) {
    reject(error as K); // Handle any synchronous exceptions
  }
}

2. .then Method

The then method registers callbacks for fulfilled or rejected states. It ensures proper chaining by returning a new CustomPromise.

Key Points:

If the promise is pending, callbacks are queued.

If the promise is already resolved or rejected, callbacks are executed immediately.

Handles exceptions thrown within callbacks and propagates them to the next promise.

public then<U>(handlerFn: PromiseThenCallback<T, U>): CustomPromise<U, K> {
  return new CustomPromise<U, K>((resolve, reject) => {
    const handleCallback = () => {
      try {
        if (this.state === PromiseState.FULFILLED) {
          const result = handlerFn ? handlerFn(this.value) : this.value;
          if (result instanceof CustomPromise) {
            result.then(resolve).catch(reject);
          } else {
            resolve(result as U);
          }
        } else if (this.state === PromiseState.REJECTED) {
          reject(this.reason as K);
        }
      } catch (error) {
        reject(error as K);
      }
    };

    if (this.state === PromiseState.PENDING) {
      this.successCallbackHandlers.push(handleCallback);
    } else {
      handleCallback();
    }
  });
}

3. .catch Method

The catch method is syntactic sugar for handling rejected promises. It internally calls then with undefined for onFulfilled and provides the rejection handler.

public catch(handlerFn: PromiseCatchCallback<K>): CustomPromise<T, K> {
  return this.then(undefined, handlerFn);
}

4. .finally Method

The finally method executes a cleanup callback after the promise is settled (fulfilled or rejected). It doesn’t modify the resolution value or rejection reason.

public finally(handlerFn: PromiseFinallyCallback): void {
  if (this.state !== PromiseState.PENDING) {
    handlerFn();
  } else {
    this.finallyCallbackHandler = handlerFn;
  }
}
## EXAMLE USAGE

Example Usage

Testing the CustomPromise Implementation

The following demonstrates how to use the CustomPromise class with asynchronous operations:

const promise = new CustomPromise<number, string>((resolve, reject) => {
  setTimeout(() => {
    resolve(100);
  }, 1500);
});

promise
  .then((value) => {
    console.log("Step 1 resolved with:", value); // Output: Step 1 resolved  with: 100
    return value + 50;
  })
  .then((value) => {
    console.log("Step 2 resolved with:", value); // Output: Step 2 resolved with: 150
    return new CustomPromise<number, string>((resolve) => resolve(value * 2));
  })
  .then((value) => {
    console.log("Step 3 resolved with:", value); // Output: Step 3 resolved with: 300
  })
  .catch((reason) => {
    console.error("Caught error:", reason);
  });