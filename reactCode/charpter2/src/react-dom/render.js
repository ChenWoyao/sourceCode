import Component from "../react/component";
import { setAttribute } from "./dom";

function createComponent(component, props) {
    let inst;
    // 如果是类声明的组件
    if (component.prototype && component.prototype.render) {
        inst = new component(props);
    } else {
        // 如果是函数式组件,声明一个Component实例
        inst = new Component(props);
        // 实例的原型对象
        // Child.prototype = new Parent() = new Child().__proto__
        // 每个实例对象（ object ）都有一个私有属性（称之为 __proto__ ）指向它的构造函数的原型对象（prototype ）
        // 这里指定inst实例的构造函数是component，让render实际上执行的是函数return返回的东西
        inst.constructor = component;
        inst.render = function () {
            // this,谁调用就指向谁，this is inst
            return this.constructor(props);
        };
    }
    return inst;
}

// 组件的卸载处理
function unmountComponent(component) {
    if (component.componentWillUnmount) {
        component.componentWillUnmount();
    }
    removeNode(component.base);
}

// component: createComponet返回的实例
function setComponentProps(component, props) {
    // 实例还没有render的时候，没有base属性
    if (!component.base) {
        if (component.componentWillMount) {
            component.componentWillMount();
        }
    } else if (component.componentWillReceiveProps) {
        component.componentWillReceiveProps(props);
    }
    component.props = props;
    renderComponent(component);
}

export function renderComponent(component) {
    let base;
    const renderer = component.render();
    if (component.base && component.componentWillUpdate) {
        component.componentWillUpdate();
    }
    // renderer实例是jsx实例
    base = _render(renderer);

    if (component.base) {
        if (component.componentDidUpdate) {
            component.componentDidUpdate();
        }
    } else if (component.componentDidMount) {
        component.componentDidMount();
    }

    if (component.base && component.base.parentNode) {
        component.base.parentNode.replaceChild(base, component.base);
    }
    component.base = base;
    base._component = component;
}

function _render(vnode) {
    if (vnode === undefined || vnode === null || typeof vnode === "boolean")
        vnode = "";

    if (typeof vnode === "number") vnode = String(vnode);

    if (typeof vnode === "string") {
        let textNode = document.createTextNode(vnode);
        return textNode;
    }

    if (typeof vnode.tag === "function") {
        const component = createComponent(vnode.tag, vnode.attrs);
        setComponentProps(component, vnode.attrs);
        return component.base;
    }

    const dom = document.createElement(vnode.tag);

    if (vnode.attrs) {
        Object.keys(vnode.attrs).forEach((key) => {
            const value = vnode.attrs[key];
            setAttribute(dom, key, value);
        });
    }

    if (vnode.children) {
        vnode.children.forEach((child) => render(child, dom));
    }

    return dom;
}

export function render(vnode, container) {
    return container.appendChild(_render(vnode));
}

function removeNode(dom) {
    if (dom && dom.parentNode) {
        dom.parentNode.removeChild(dom);
    }
}
