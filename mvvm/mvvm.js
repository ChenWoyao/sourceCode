// 参考： https://juejin.cn/post/6844903586103558158#heading-5
const log = console.log.bind(console)

function Mvvm(options = {}) {
    this.$options = options
    let data = this.$options.data
    this.__data = data
    observe(data)
    for (let key in data) {
        Object.defineProperty(this, key, {
            configurable: true,
            get() {
                return this.__data[key]
            },
            /*数据更新视图*/
            set(newVal) {
                this.__data[key] = newVal
            }
        })
    }
    // 初始化一个computed
    initComputed.call(this);
    new Compoile(options.el, this)
    // 所有事情处理好后执行mounted钩子函数
    options.mounted.call(this)
}

/*
    数据劫持 Object.defineProperty 对data对象的每个属性进行深度劫持
*/
function observe(data) {
    if (!data || typeof data !== 'object') return
    return new Observer(data)
}
function Observer(data) {
    let dep = new Dep()
    for (let key in data) {
        let val = data[key]
        observe(val)
        Object.defineProperty(data, key, {
            configurable: true, // 可以配置对象，删除属性
            // writable: true, // 可以修改对象
            // enumerable: true, // 可以枚举对象
            get() {
                // 将需要订阅的对象放入广播队列
                Dep.target && dep.addSub(Dep.target)
                return val
            },
            set(newVal) {
                if (val === newVal){
                    return
                }
                val = newVal
                observe(newVal)
                // 广播通知所有订阅对象更新
                dep.notify()
            }
        })
    }
}
/*
    数据代理: mvvvm._data.a.b  的写法比较长，改成mvvvm.a.b的形式
*/

/*
    数据编译, 将body中{{}}里面的内容解析出来
*/
function Compoile(el, vm) {
    vm.$el = document.querySelector(el)
    function replace(frag) {
        Array.from(frag.childNodes).forEach(node => {
            let txt = node.textContent
            let reg = /\{\{(.*?)\}\}/g
            if (node.nodeType === 1) {
                let nodeAttr = node.attributes
                Array.from(nodeAttr).forEach(attr => {
                    let name = attr.name
                    let exp = attr.value
                    if (name.includes('v-')) {
                        // 初始化数据
                        node.value = vm[exp]
                    }
                    new Watcher(vm, exp, function(newVal) {
                        node.value = newVal
                    })
                    node.addEventListener('input', e => {
                        let newVal = e.target.value
                        // 而值的改变会调用set，就会进行广播通知，通知每一个Watcher实例进行更新
                        vm[exp] = newVal
                    })
                })
            }
            if (node.nodeType === 3 && reg.test(txt)) {
                function replaceTxt() {
                    node.textContent = txt.replace(reg, (matched, placeholder) => {
                        // 订阅所有需要处理的数据，就是每一个{{xxx}}实例
                        new Watcher(vm, placeholder, replaceTxt)
                        return placeholder.split('.').reduce((val, key) => {
                            return val[key]
                        }, vm)
                    })
                }
                replaceTxt()
            }
            if (node.childNodes && node.childNodes.length) {
                replace(node)
            }
        })
    }
    replace(vm.$el)
}
/*
    发布订阅
    目前数据能劫持，代理，并能够翻译。不过劫持数据更新后，视图还不能更新
    所以要订阅一个事件，当数据改变需要重新刷新视图
    这就需要在replace替换的逻辑里来处理
    通过new Watcher把数据订阅一下，数据一变就通知订阅执行改变内容的操作
*/
// Dep是管理订阅对象的模型
function Dep() {
    this.subs = []
}
Dep.prototype = {
    addSub(sub) {
        this.subs.push(sub)
    },
    notify() {
        this.subs.forEach(sub => sub.update())
    }
}
function Watcher(vm ,exp, fn) {
    this.fn = fn
    this.vm = vm
    this.exp = exp
    Dep.target = this
    let arr = exp.split('.')
    let val = vm
    arr.forEach(key => {val = val[key]}) // 因为有数据劫持，所以这里的获取数据的行为是能劫持到的
    Dep.target = null
}
Watcher.prototype.update = function() {
    let arr = this.exp.split('.')
    let val = this.vm
    arr.forEach(key => val = val[key])
    this.fn(val)
}
/*
    双向数据绑定
    这里的双向绑定需要对v-model进行处理，视图更新的时候通过input事件将新的值赋予到vm[exp]。
*/
/*
    新增功能：computed,mounted
*/
function initComputed() {
    let vm = this
    let computed = this.$options.computed
    Object.keys(computed).forEach(key => {
        Object.defineProperty(vm, key, {
            /*
                computed: {fullname: () => {}} or {fullname: {get:()=>{}, set:()=>{}}}
            */
            get: typeof computed[key] === 'function' ? computed[key] : computed[key].get,
            set() {

            }
        })
    })
}
