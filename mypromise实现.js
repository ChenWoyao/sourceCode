// const log = console.log.bind(console)
// https://zhuanlan.zhihu.com/p/102018323
// ///// 链式版本 /////
// /*
// * then 方法中，创建并返回了新的 Promise 实例，这是串行Promise的基础，是实现真正链式调用的根本
// * then 方法传入的形参 onFulfilled 以及创建新 Promise 实例时传入的 resolve 放在一起，被push到当前 Promise 的 callbacks 队列中，这是衔接当前 Promise 和后邻 Promise 的关键所在
// * 根据规范，onFulfilled 是可以为空的，为空时不调用 onFulfilled
// * */
// class MPromise {
//   callbacks = []
//   state = 'pending'
//   value = null
//   constructor(fn) {
//     fn(this._resolve)
//   }
//   // 将注册callback(cb)交给_handle
//   // 返回新的promise
//   then = (onFullfilled) => {
//     return new MPromise(resolve => {
//       // 这里的resolve参数即是自己的resolve函数
//       log('resolve', resolve)
//       // 通过callback拿到了下一个promise对象的resolve方法
//       // 这里的难点是如何让下一的promise对象的value的值是
//       // 来自自身执行onFullfilled的结果
//       this._handle({
//         onFullfilled: onFullfilled || null,
//         resolve: resolve
//       })
//     })
//   }
//   // pending的时候注册callback
//   // fulfilled的时候调用callback,并更新resolve
//   _handle = (callback) => {
//     if (this.state === 'pending') {
//       this.callbacks.push(callback)
//       return
//     }
//     // then里面没有onFullfilled函数
//     // onFullfilled函数主要的功能是更新value
//     // handle在fullilled状态的时候
//     if (!callback.onFullfilled) {
//       callback.resolve(this.value)
//       return
//     }
//     let ret = callback.onFullfilled(this.value)
//     callback.resolve(ret)
//   }
//   // value 初始来自外部
//   // 后面来自链式调用的onFullfilled的返回值
//   _resolve = (value) => {
//     log('run resolve', value)
//     if (value instanceof MPromise) {
//       value.then(this._resolve)
//     }
//     setTimeout(() => {
//       this.state = 'fulfilled'
//       this.value = value
//       this.callbacks.forEach(callback => this._handle(callback))
//     })
//   }
// }
//
// function getUserId() {
//   return new MPromise((resolve) => {
//     resolve('7147')
//   })
// }
//
// getUserId().then((id) => {
//   log('id', id)
//   return 'woyao'
// }).then((name) => {
//   log('name', name)
//   return 'math'
// }).then((course) => {
//   log('course', course)
//   return 100
// })


class MPromise {
  callbacks = []
  state = 'pending'
  value = null
  constructor(fn) {
    fn(this._resolve, this._reject)
  }
  // 将注册callback(cb)交给_handle
  // 返回新的promise
  then = (onFullfilled, onRejected) => {
    return new MPromise((resolve, reject) => {
      // 这里的resolve参数即是自己的resolve函数
      log('resolve', resolve)
      // 通过callback拿到了下一个promise对象的resolve方法
      // 这里的难点是如何让下一的promise对象的value的值是
      // 来自自身执行onFullfilled的结果
      this._handle({
        onFullfilled: onFullfilled || null,
        onRejected: onRejected || null,
        resolve: resolve,
        reject: reject,
      })
    })
  }
  // pending的时候注册callback
  // fulfilled的时候调用callback,并更新resolve
  _handle = (callback) => {
    if (this.state === 'pending') {
      this.callbacks.push(callback)
      return
    }
    let cb = this.state === fulfilled ? callback.onFullfilled : callback.onRejected
    // then里面没有onFullfilled函数
    // onFullfilled函数主要的功能是更新value
    // handle在fullilled状态的时候
    if (!cb) {
      cb = this.state === 'fulfilled' ? callback.resolve : callback.reject
      cb(this.value)
      return
    }
    let ret
    try {
      ret = cb(this.value)
      cb = this.state === 'fulfilled' ? callback.resolve : callback.reject
    } catch (error) {
      ret = error
      cb = callback.reject
    } finally {
      cb(ret)
    }
  }
  // value 初始来自外部
  // 后面来自链式调用的onFullfilled的返回值
  _resolve = (value) => {
    log('run resolve', value)
    if (value instanceof MPromise) {
      value.then(this._resolve)
    }
    setTimeout(() => {
      this.state = 'fulfilled'
      this.value = value
      this.callbacks.forEach(callback => this._handle(callback))
    })
  }
  _reject(error) {
    this.state = 'rejected'
    this.value = error
    this.callbacks.forEach(callback => this._handle(callback))
  }
}
