import { setAttribute } from "./dom";
import { setComponentProps, removeNode, unmountComponent, createComponent } from "./utils"

/**
 * @param {HTMLElement} dom 真实DOM
 * @param {vnode} vnode 虚拟DOM
 * @param {HTMLElement} container 容器
 * @returns {HTMLElement} 更新后的DOM
 */
// 比较虚拟dom与真实dom的区别。
export function diff(dom, vnode, container) {
    // 第一初始化的时候dom为null
    const ret = diffNode(dom, vnode);
    // 第一次渲染的时候Dom没有parentNode
    if (container && ret.parentNode !== container) {
        container.appendChild(ret);
    }
    return ret;
}

// 比较当前的虚拟dom节点和dom. reactElement 与 目前的html
/*
vnode: {
    tag: constructor/dom
    attrs: {}
    children: []:vnode[]
    key: attrs.key || null,
} | string | number
dom: HTMLHeadingElement
HTMLHeadingElement: {
    childNodes: [],
    attributes: {},
    nodeType: number
}
*/
// 同一节点的diff
export function diffNode(dom, vnode) {
    let out = dom;
    if (vnode === undefined || vnode === null || typeof vnode === "boolean") {
        vnode = "";
    }
    if (typeof vnode === "number") {
        vnode = String(vnode);
    }
    // 目前需要渲染的虚拟dom是个文本
    if (typeof vnode === "string") {
        if (dom && dom.nodeType === 3) {
            if (dom.textContent !== vnode) {
                dom.textContent = vnode;
            }
        } else {
            out = document.createTextNode(vnode);
            // 是个在html文本中存在的dom
            if (dom && dom.parentNode) {
                dom.parentNode.replaceChild(out, dom);
            }
        }
        return out;
    }
    // 组件的diff
    if (typeof vnode.tag === "function") {
        return diffComponent(dom, vnode);
    }
    // dom不存在或者dom的字段不一样。
    // 原来这个坑渲染的是个<div><span/><img/></div>, 现在是<span><a/></span>
    // 那么diff [<span/>, <img/>], {tag: span, children: [{tag: a}]}
    if (!dom || !isSameNodeType(dom, vnode)) {
        out = document.createElement(vnode.tag);
        if (dom) {
            // 将原来的子节点移到新节点out下
            [...dom.childNodes].map(out.appendChild);
            if (dom.parentNode) {
                dom.parentNode.replaceChild(out, dom);
            }
        }
    }
    // 子节点的diff
    if (
        (vnode.children && vnode.children.length) ||
        (out.childNodes && out.childNodes.length)
    ) {
        diffChildren(out, vnode.children);
    }
    // 修改当前节点的属性
    diffAttributes(out, vnode);
    return out;
}

function diffComponent(dom, vnode) {
    // dom._component说明这个dom是组件渲染出来的Dom
    // dom._component 当前dom所对应的reactElement实例
    let c = dom && dom._component;
    let oldDom = dom;

    // 如果组件类型没有变化，则重新set props
    if (c && c.constructor === vnode.tag) {
        setComponentProps(c, vnode.attrs);
        dom = c.base;
        // 如果组件类型变化，则移除掉原来组件，并渲染新的组件
    } else {
        if (c) {
            unmountComponent(c);
            oldDom = null;
        }
        c = createComponent(vnode.tag, vnode.attrs)
        setComponentProps(c, vnode.attrs);
        dom = c.base;
        // 虚拟dom渲染的dom与当前dom不一样
        if (oldDom && dom !== oldDom) {
            oldDom._component = null;
            removeNode(oldDom);
        }
    }
    return dom;
}

function isSameNodeType(dom, vnode) {
    if (typeof vnode === "string" || typeof vnode === "number") {
        return dom.nodeType === 3;
    }

    if (typeof vnode.tag === "string") {
        return dom.nodeName.toLowerCase() === vnode.tag.toLowerCase();
    }
    // 当前dom是由该虚拟dom的组件生成的
    return dom && dom._component && dom._component.constructor === vnode.tag;
}

function diffAttributes(dom, vnode) {
    const old = {}; // 当前DOM的属性
    const attrs = vnode.attrs; // 虚拟DOM的属性

    for (let i = 0; i < dom.attributes.length; i++) {
        const attr = dom.attributes[i];
        old[attr.name] = attr.value;
    }

    // 如果原来的属性不在新的属性当中，则将其移除掉（属性值设为undefined）
    for (let name in old) {
        if (!(name in attrs)) {
            setAttribute(dom, name, undefined);
        }
    }

    // 更新新的属性值
    for (let name in attrs) {
        if (old[name] !== attrs[name]) {
            setAttribute(dom, name, attrs[name]);
        }
    }
}

function diffChildren(dom, vchildren) {
    const domChildren = dom.childNodes;
    // 没有key标记的dom节点放在children
    const children = [];
    // 有key标记的dom节点放在keyed
    const keyed = {};

    // 将有key的节点和没有key的节点分开
    if (domChildren.length > 0) {
        for (let i = 0; i < domChildren.length; i++) {
            const child = domChildren[i];
            const key = child.key;
            if (key) {
                // keyedLen++;
                keyed[key] = child;
            } else {
                children.push(child);
            }
        }
    }

    if (vchildren && vchildren.length > 0) {
        let min = 0;
        let childrenLen = children.length;

        for (let i = 0; i < vchildren.length; i++) {
            const vchild = vchildren[i];
            const key = vchild.key;
            let child;
            // 如果有key，找到对应key值的节点
            if (key) {
                if (keyed[key]) {
                    child = keyed[key];
                    keyed[key] = undefined;
                }
            } else if (min < childrenLen) {
            // 如果没有key，则优先找类型相同的节点
            // 遍历当前没有key的dom节点
                for (let j = min; j < childrenLen; j++) {
                    let c = children[j];

                    if (c && isSameNodeType(c, vchild)) {
                        child = c;
                        children[j] = undefined;
                        // 找到了但是是最后一个
                        if (j === childrenLen - 1) childrenLen--;
                        // 找到了是第一个
                        if (j === min) min++;
                        break;
                    }
                }
            }
            // 对比
            child = diffNode(child, vchild);
            // 更新DOM
            const f = domChildren[i];
            // child!==dom说明确实有变动，child!==f说明位置发生变化
            if (child && child !== dom && child !== f) {
                // 如果更新前的对应位置为空，说明此节点是新增的
                if (!f) {
                    dom.appendChild(child);
                    // 如果更新后的节点和更新前对应位置的下一个节点一样，说明当前位置的节点被移除了
                } else if (child === f.nextSibling) {
                    removeNode(f);
                    // 将更新后的节点移动到正确的位置
                } else {
                    // 注意insertBefore的用法，第一个参数是要插入的节点，第二个参数是已存在的节点
                    dom.insertBefore(child, f);
                }
            }
        }
    }
}

