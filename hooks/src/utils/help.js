/*
 * @Author: your name
 * @Date: 2020-12-30 10:26:40
 * @LastEditTime: 2020-12-30 14:04:59
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /myNote/项目集合/woyao_cli/src/utils/help.js
 */
import Cookies from 'js-cookie'

export function serialize(obj, prefix) {
    const str = []
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const k = prefix ? `${prefix}[${key}]` : p
            const v = obj[key]
            str.push(typeof v === 'object' ? serialize(v, k) : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        }
    }
    return str.join('&')
}

export function getToken(TokenKey) {
    return Cookies.get(TokenKey)
}

export function setToken(TokenKey, token) {
    return Cookies.set(TokenKey, token)
}

export function removeToken(TokenKey) {
    return Cookies.remove(TokenKey)
}

/**
 * @export
 * @param {*} date    Date类型
 * @param {*} cFormat 任何你想要的格式
 * @returns
 */
export function parseDate(date, cFormat) {
    let format = cFormat || 'y-m-d h:i:s';
    let formatObj = {
        y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate(),
        h: date.getHours(),
        i: date.getMinutes(),
        s: date.getSeconds(),
        a: date.getDay()
    };
    const time_str = format.replace(/([ymdhisa])+/g, (result, key) => {
        let value = formatObj[key];
        if (key === 'a') {
            return ['日', '一', '二', '三', '四', '五', '六'][value]
        }
        return value.toString().padStart(2, '0');
    });
    return time_str;
}

/**
 * 本质：处理掉多余的操作，比如用户的疯狂点击
 * 用法：比如事件监听的处理: onClick = enhanceDebounce(fn, wait, true)
 * 防抖，在wait时间内只能有效执行一次, 多次执行只有一次有效
 * @param {*} func 需要执行的函数
 * @param {*} wait 延迟时间
 * @param {*} immediate: 是否先立即执行函数，而不是在wait之后在执行
 */
export function enhanceDebounce(func, wait, immediate = true) {
    let timer, context, args
    const later = () => setTimeout(() => {
        timer = null // 到达wait时间后，清空自己
        if (!immediate) {
            func.apply(context, args)
            context = args = null
        }
    }, wait)
    return function (...params) {
        if (!timer) {
            timer = later()
            if (immediate) {
                func.apply(this, params)
            } else {
                context = this
                args = params
            }
        } else {
            clearTimeout(timer)
            timer = later()
        }
    }
}

/**
 * 节流: 本质就是减少执行次数，降低浏览器消耗性能
 * 用法比如滚动条滚动的时候，控制头部菜单栏是否显示
 * onScroll = (e) => if (e.currentTarget.scrollTop > 200) { setShowTopbar(true) }
 * 技能有cd,每隔固定时间执行一次
 * @param {*} fn
 */
export function throttle(fn) {
    if (requestAnimationFrame) {
        requestAnimationFrame(fn)
    } else {
        setTimeout(fn, 20)
    }
}

/**
 * eventEmitter实现
 */
export class EventEmitter {
    constructor(events) {
        this.events = events || {}
    }
    subscribe(name, cb) {
        (this.events[name]) || (this.events[name] = []).push(cb)
        return {
            unsubscribe: () => {
                this.events[name] && this.events[name].splice(this.events[name].indexOf(cb) >>> 0, 1)
            }
        }
    }
    emit(name, ...args) {
        (this.events[name] || []).forEach(fn => fn(...args))
    }
}

/**
 * compose实现
 * compose (widthData(), widhtLogger())(Component)
*/

export const compose = (...fns) => (Component) =>  {
    return fns.reduceRight((Component, fn) => {
        return fn(Component)
    }, Component)
}
