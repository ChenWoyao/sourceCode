import Component from './component.js'

// 定义了如何处理jsx转成ReactElement
function createElement( tag, attrs, ...children ) {
    return {
        tag,
        attrs,
        children
    }
}

export default createElement;
