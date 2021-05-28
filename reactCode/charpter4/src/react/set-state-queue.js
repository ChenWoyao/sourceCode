import { renderComponent } from '../react-dom/render'

const setStateQueue = []
const renderQueue = []

// 异步执行
function defer(fn) {
    return Promise.resolve().then(fn)
}

function flush() {
    let item, component
    while(item = setStateQueue.shift()) {
        const { stateChange, component } = item
         // 如果没有prevState，则将当前的state作为初始的prevState
        if (!component.prevState) {
            component.prevState = Object.assign({}, component.state)
        }
        // 如果stateChange是一个方法，也就是setState的第二种形式
        if (typeof stateChange === 'function') {
            Object.assign(component.state, stateChange(component.prevState, component.props))
        } else {
            // 如果stateChange是一个对象，则直接合并到setState中
            Object.assign(component.state, stateChange)
        }
        component.prevState = component.state
    }
    while (component = renderQueue.shift()) {
        renderComponent(component)
    }
}

export function enqueueSetState(stateChange, component) {
    // 第一次的时候为空队列
    if (setStateQueue.length === 0) {
        // 这个是异步执行的
        defer(flush)
    }
    setStateQueue.push({
        stateChange,
        component
    })
    // 将component加入渲染队列，其实这里应该用集合这个结构
    if (!renderQueue.some(item => item === component)) {
        renderQueue.push(component)
    }
}
