// https://juejin.cn/post/6968713283884974088#heading-23
const log = console.log.bind(console)

const ensure = (expression, successInfo, errorInfo) => {
    if (expression) {
        log(successInfo)
    } else {
        log(errorInfo)
    }
}

// fn4(f3(1)) = 11
// f3 = fn3(f2) = 7
// f2 = fn2(f1) = 4
// f1 = fn1(1) = 2

const compose = (...fns) => {
    if (!fns.length) return null
    if (fns.length === 1) return fns[0]
    return fns.reduce((cur, next) => {
        return (...args) => next(cur(...args))
    })
}

/**
 * 关于setInterval:
 * 再次强调，定时器指定的时间间隔，表示的是何时将定时器的代码添加到消息队列，而不是何时执行代码。
 * 有两个缺点:
 * 1. 使用 setInterval 时，某些间隔会被跳过；
 * 2. 可能多个定时器会连续执行；
 *每个 setTimeout 产生的任务会直接 push 到任务队列中；
 而 setInterval 在每次把任务 push 到任务队列前，
 都要进行一下判断(看上次的任务是否仍在队列中，如果有则不添加，没有则添加)。
 *
 * @param {*} fn
 * @param {*} timer
 * @returns
 */
function interval(fn, timer) {
    let later = null
    function loop() {
        fn()
        // 在前一个定时器执行完前，不会向队列插入新的定时器
        // 保证定时器间隔（解决缺点二）
        later = setTimeout(loop, timer)
    }
    loop()
    return {
        cancel: () => {
            clearTimeout(later)
        }
    }
}


class EventEmitter {
    constructor() {
        // 订阅总集合
        this.events = {}
    }
    /* 添加关于event的订阅者 */
    on(event, callback) {
        if (this.events[event]) {
            this.events[event].push(callback);
        } else {
            this.events[event] = [callback]
        }
    }
    /* 触发-发布 */
    emit(event) {
        if (this.events[event]) {
            this.events[event].forEach((fn) => fn())
        }
    }

    // 删除订阅了某个event的订阅者
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(fn => fn !== callback)
        }
    }

    // 订阅某event，执行一次后就不再订阅了
    once(event, callback) {
        let that = this;
        function cancel() {
            callback()
            that.off(event, cancel);
        }
        this.on(event, cancel)
    }
}

const duplicate = (arr) => {
    return [...new Set(arr)]
}

const flatten = (arr) => {
    // [1, 2, [1, [2, 3, [4, 5, [6]]]]]
    if (!arr.length) return
    const handleArr = (arr) => {
        let ans = []
        arr.forEach(item => {
            if (Array.isArray(item)) {
                ans = ans.concat(...handleArr(item))
            } else {
                ans.push(item)
            }
        })
        return ans
    }
    return handleArr(arr)
    //    return arr.reduce((result, item) => {
    //        return Array.isArray(item) ? [...result, ...flatten(item)] : [...result, item]
    //    }, [])
}

// Object.prototype: 原型对象
// instance.__proto__: instance的构造对象的原型对象，instance会继承该原型对象的方法，继承构造对象的属性
function Parent(name) {
    this.name = name;
    this.say = () => {
        console.log('say goodbye')
    };
}

Parent.prototype.play = () => {
    console.log('say play')
}

function Children(name) {
    Parent.call(this)
    this.name = name
}

Children.prototype = Object.create(Parent.prototype)
Children.prototype.constructor = Children

class Scheduler {
    constructor(limit) {
        // 等待队列
        this.queue = []
        // 正在执行的任务数量
        this.runCounts = 0
        // 任务队列能处理的量
        this.limit = limit
    }
    add(time, order) {
        const task = () => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    console.log(order)
                    resolve()
                }, time)
            })
        }
        this.queue.push(task)
    }
    taskStart() {
        for (let i = 0; i < this.limit; i++) {
            this.request()
        }
    }
    request() {
        if (!this.queue || !this.queue.length || this.runCounts >= this.limit) {
            return
        }
        this.runCounts++
        this.queue.shift()().then(() => {
            this.runCounts--
            this.request()
        })
    }
}

/**
 * new 操作符干了什么:
    创建一个对象，继承自一个原型对象，就是指定实例对象的__proto__为构造函数的原型对象
    构造函数执行，this指定为这个实例对象
    如果构造函数返回了一个对象，则该对象取代步骤一: 创建的对象
    如果没有，就不替换
 */
const New = (func, ...args) => {
    let obj = Object.create(func.prototype)
    let result = func.call(obj, ...args)
    if (typeof result === 'object') {
        return result
    }
    return obj
}

// MyCall(obj, ...args)
// 将this指向obj, this(...args) 变成context(...args)
Function.prototype.MyCall = function (context, ...args) {
    context = context || window
    let fn = Symbol()
    context[fn] = this
    const result = context[fn](...args)
    delete context.fn
    return result
}

Function.prototype.myApply = function (context, args) {
    context = context || window
    let fn = Symbol()
    context[fn] = this
    const result = context.func(...args)
    delete context.fn
    return result
}

Function.prototype.Mybind = function (context, ...args) {
    context = context || window
    context.func = this
    const result = () => {
        const res = context.func(...args)
        delete context.func
        return res
    }
    return result
}

// 深拷贝这个比较复杂
// 考虑的全的话比较难写
// 目前解决循环引用和symbol类型
// WeakMap 对象是一组键/值对的集合，其中的键是弱引用的。其键必须是对象，而值可以是任意的。这样再循环引用的时候，如果没有被继续使用，就会被垃圾回收
//
/*
let o1 = {
  value: o2,
  []: 10,
}
let o2 = {
    value: o1,
}
*/
const isObject = (val) => {
    return typeof val === 'object' && val !== null
}

const deepClone = (obj, hash = new WeakMap()) => {
    if (!isObject(obj)) return obj
    if (hash.has(obj)) {
        return hash.get(obj)
    }
    let target = Array.isArray(obj) ? [] : {}
    hash.set(obj, target)
    Reflect.ownKeys(obj).forEach(key => {
        if (isObject(obj[key])) {
            target[key] = deepClone(obj[key], hash)
        } else {
            target[key] = obj[key]
        }
    })
    return target
}

const myInstanceof = (left, right) => {
    while (true) {
        if (left === null) {
            return false
        }
        if (left.__proto__ === right.prototype) {
            return true
        }
        left = left.__proto__
    }
}

const curring = (func) => (...args) => {
    if (func.length <= args.length) {
        return func(...args)
    }
    return (...args2) => curring(func)(...args, ...args2)
}

// 防抖，多次执行只有一次有效
const debounce = (fn, delay, immediate) => {
    let later = null
    return (...args) => {
        if (!later && immediate) {
            fn(...args)
        }
        later && clearTimeout(later)
        later = setTimeout(func, delay, ...args)
    }
}

// 节流，技能有cd
const throttle = (func, delay) => {
    let later = null
    return (...args) => {
        if (later) return
        later = setTimeout(() => {
            func(...args)
            later = null
        }, delay)
    }
}

// 虚拟dom转真实dom
const render = (vnode) => {
    if (typeof vnode === 'number') {
        vnode = String(vnode)
    }
    if (typeof vnode === 'string') {
        return document.createTextNode(vnode)
    }
    const dom = document.createElement(vnode.tag)
    if (vnode.attrs) {
        Reflect.ownKeys(vnode.attrs).forEach(key => {
            dom.setAttribute(key, vnode.attrs[key])
        })
    }
    vnode.children.forEach(child => dom.appendChild(render(child)))
    return dom
}

// 分片渲染大量数据
const burstRender = (total) => {
    let ul = document.getElementById('container')
    let pageSize = 20
    let index = 0
    const loop = (curTotal, curIndex) => {
        if (curTotal <= 0) {
            return false
        }
        let pageCount = Math.min(curTotal, pageSize)
        window.requestAnimationFrame(function () {
            for (let i = 0; i < pageCount; i++) {
                let li = document.createElement('li')
                li.innerText = curIndex + i + ':' + total
                ul.appendChild(li)
            }
            loop(curTotal - pageCount, curIndex + pageCount)
        })
    }
    loop(total, index)
}

/*
https://github.com/YvetteLau/Blog/issues/2
1. new Promise(fn: (resolve, reject) => {}): Promise

2. Promise.then(handleFulfilled, handleRejected): Promise
=> then方法会根据Promise实例中fn函数是resolve还是reject被调用，然后决定执行handleFulfilled哈市handleRejected

3. Promise.catch(handleRejected): Promise
=> 捕获链式调用中没有被处理的错误(reject，Error等)

4. promise.finally(onfinally: () => void)
=> 链式调用最后执行函数

5. promise.all(iterable)
=> 这个方法返回一个新的promise对象，该promise对象在iterable参数对象里所有的promise对象都成功的时候才会触发成功，一旦有任何一个iterable里面的promise对象失败则立即触发该promise对象的失败。这个新的promise对象在触发成功状态以后，会把一个包含iterable里所有promise返回值的数组作为成功回调的返回值，顺序跟iterable的顺序保持一致；如果这个新的promise对象触发了失败状态，它会把iterable里第一个触发失败的promise对象的错误信息作为它的失败错误信息。

6. Promise.any(iterable)
=> 接收一个Promise对象的集合，当其中的一个 promise 成功，就返回那个成功的promise的值。

7. Promise.resolve(value)

8. Promise.reject(value)

9. Promise.race(iterable)
=> Promise.race([p1, p2, p3])里面哪个结果获得的快，就返回那个结果，不管结果本身是成功状态还是失败状态。
*/

class MyPromise {
    constructor(fn) {
        // 状态为pending, fulfill, reject
        this.state = 'pending'
        // then注册的成功函数
        this.successFun = []
        // then注册的失败函数
        this.failureFun = []

        const resolve = val => {
            if (this.state !== 'pending') return
            this.state = 'fulfilled'
            setTimeout(() => {
                log('run')
                // 给当前的promise的resolve里面的val值传递给then
                this.successFun.forEach(item => item.call(this, val))
            })
        }

        const reject = (err) => {
            if (this.state !== 'pending') return
            this.state = 'rejected'
            setTimeout(() => {
                this.failureFun.forEach(item => item.call(this, err))
            })
        }

        try {
            fn(resolve, reject)
        } catch (error) {
            reject(error)
        }
    }
    then(handleResolved, handleRejected) {
        handleResolved = typeof handleResolved !== 'function' ? (v) => v : handleResolved
        handleRejected = typeof handleRejected !== 'function' ? (err) => {
            throw err
        } : handleRejected
        log('handleResolved', handleResolved.toString())
        log('handleRejected', handleRejected.toString())
        return new MyPromise((resolve, reject) => {
            // 这里的this指向的上一级作用域
            // 这里需要包装一层
            // 因为handleResolved可能执行出错或者返回一个MyPromise
            this.successFun.push(val => {
                try {
                    let x = handleResolved(val)
                    // 这里resolve(x)，把x传入下一个then
                    // x.then(resolve, reject), 这里通过
                    // resolve本身的promise拿到外面promise在
                    // resolve传的值
                    // resolve其实也就是给then传值
                    x instanceof MyPromise ? x.then(resolve, reject) : resolve(x)
                } catch (error) {
                    reject(error)
                }
            })

            this.failureFun.push(val => {
                try {
                    let x = handleRejected(val)
                    x instanceof MyPromise ? x.then(resolve, reject) : reject(x)
                } catch (error) {
                    reject(error)
                }
            })
        })
    }
    /**
    如果 value 是个 thenable 对象，返回的promise会“跟随”这个thenable的对象，采用它的最终状态
    如果传入的value本身就是promise对象，那么Promise.resolve将不做任何修改、原封不动地返回这个promise对象。
    其他情况，直接返回以该值为成功状态的promise对象。
     */
    static resolve(params) {
        if (params instanceof MyPromise) {
            return params
        }
        return new MyPromise((resolve, reject) => {
            if (params && params.then && typeof params.then === 'function') {
                params.then(resolve, reject)
            } else {
                resolve(params)
            }
        })
    }
    // Promise.reject方法和Promise.resolve不同，Promise.reject()方法的参数，会原封不动地作为reject的理由，变成后续方法的参数。
    static reject(reason) {
        return new MyPromise((resolve, reject) => {
            reject(reason)
        })
    }
    // 用于指定出错时的回调，是特殊的then方法，catch之后，可以继续 .then
    catch(handleRejected) {
        return this.then(null, handleRejected)
    }
    // 不管成功还是失败，都会走到finally中,并且finally之后，还可以继续then。并且会将值原封不动的传递给后面的then.
    finally(callback) {
        return this.then(
            value => {
                return MyPromise.resolve(callback()).then(() => {
                    return value
                })
            },
            err => {
                return MyPromise.resolve(callback()).then(() => {
                    throw err
                })
            }
        )
    }
    static all(promiseArr) {
        const result = []
        let count = 0
        return new MyPromise((resolve, reject) => {
            for (let i = 0; i < promiseArr.length; i++) {
                MyPromise.resolve(promiseArr[i]).then(
                    res => {
                        result[i] = res
                        count++
                        if (count === promiseArr.length) {
                            resolve(result)
                        }
                    }),
                    err => {
                        reject(err)
                    }
            }
        })
    }
    race(promiseArr) {
        return new MyPromise((resolve, reject) => {
            for (let i = 0; i < promiseArr.length; i++) {
                MyPromise.resolve(promiseArr[i]).then(
                    (res) => {
                        resolve(res);
                    },
                    (err) => {
                        reject(err);
                    }
                );
            }
        });
    }
}

const testModule = {
    'compose': () => {
        function fn1(x) {
            return x + 1;
        }
        function fn2(x) {
            return x + 2;
        }
        function fn3(x) {
            return x + 3;
        }
        function fn4(x) {
            return x + 4;
        }
        const fn = compose(fn1, fn2, fn3, fn4);
        ensure(11 === fn(1), 'compose pass', 'compose failure')
    },
    'eventEmitter': () => {
        const emitter = new EventEmitter()
        emitter.on('launch', () => {
            console.log('吃饭')
        })
        emitter.on('launch', () => {
            console.log('快乐水')
        })
        emitter.once('afternoon', () => {
            console.log('约会')
        })
        emitter.once('afternoon', () => {
            console.log('亲嘴')
        })
        emitter.on('night', () => {
            console.log('睡觉')
        })
        emitter.emit('launch')
        emitter.emit('afternoon')
        emitter.emit('night')
        emitter.emit('launch')
        emitter.emit('afternoon')
        emitter.emit('night')
    },
    'duplicate': () => {
        const arr = [1, 1, 2, 2, 3, 3]
        const result = duplicate(arr)
        ensure(result.toString() === "1,2,3", 'duplicate pass', 'duplicate failure')
    },
    'flatten': () => {
        const arr = [1, 2, [3, [4, 5, [6, 7, [8]]]]]
        const result = flatten(arr)
        log('result', result)
        ensure(result.toString() === "1,2,3,4,5,6,7,8", 'duplicate pass', 'duplicate failure')
    },
    'inherit': () => {
        const child = new Children('woyao')
        log(child.name)
        child.say()
        child.play()
    },
    'scheduler': () => {
        const scheduler = new Scheduler(2)
        // log(scheduler.queue, scheduler)
        const addTask = (timer, order) => {
            scheduler.add(timer, order)
        }
        addTask(1000, "1")
        addTask(500, '2')
        addTask(300, '3')
        addTask(400, '4')
        scheduler.taskStart()
        // 2 -> 3 -> 1 -> 4
    },
    'new': () => {
        function Person(name, age) {
            this.name = name
            this.age = age
            return this
        }
        Person.prototype.say = function () {
            console.log(this.name, this.age)
        }

        let p1 = New(Person, 'woyao', '18')
        p1.say()
        log(p1.__proto__, Person.prototype)
    },
    'call': () => {
        function Person() {
            this.name = 'woyao'
            this.getName = function (...args) {
                return this.name + args.toString()
            }
        }
        name = 'woruo'
        const person = new Person()
        const getNameFunc = person.getName
        log(getNameFunc(',chen'))
        log(getNameFunc.MyCall(person, ',chen'))
        log(getNameFunc.Mybind(person, ',chen')())
    },
    'curry': () => {
        const add = (a, b) => a + b
        const wrapAdd = curring(add)
        const res = wrapAdd(1)(2)
        ensure(res === 3, 'curring pass', 'curring failure')
    },
    'render': () => {
        const vnode = {
            tag: 'DIV',
            attrs: {
                id: 'app'
            },
            children: [
                {
                    tag: 'SPAN',
                    children: [
                        { tag: 'A', children: [] }
                    ]
                },
                {
                    tag: 'SPAN',
                    children: [
                        { tag: 'A', children: [] },
                        { tag: 'A', children: [] }
                    ]
                },
                'hh',
                11,
            ]
        }
        log(render(vnode))
    },
    'MyPromise': () => {
        new MyPromise((resolve, reject) => {
            setTimeout(() => {
                reject('hello from woyao')
            })
        }).then(response => {
            console.log('response', response)
            // return new MyPromise((resolve, reject) => {
            //     resolve('i am fine')
            // })
            // return 'i am fine'
            throw new Error('i am fine')
        }).catch(res => {
            console.log('res', res)
        })
    },
}


// testModule['compose']()
// testModule['eventEmitter']()
// testModule['duplicate']()
// testModule['flatten']()
// testModule['inherit']()
// testModule['scheduler']()
// testModule['new']()
// testModule['call']()
// testModule['curry']()
// testModule['render']()
// testModule['MyPromise']()
