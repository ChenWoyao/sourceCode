/*
 * @Author: your name
 * @Date: 2020-12-30 10:04:52
 * @LastEditTime: 2020-12-30 11:30:22
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /myNote/项目集合/woyao_cli/src/utils/api.js
 */
import axios from 'axios';
import qs from 'qs'
import {
    useContext
} from 'react'
import {
    getToken
} from '@/utils/help'
import {
    Store as GlobalStore
} from '@/hook.redux/global'

const {
    token
} = useContext(GlobalStore)
const tokenKey = 'xxxx'

function handleSuccess(res) {
    return Promise.resolve(res.data);
}

function handleError(err) {
    return Promise.reject(err)
}


axios.defaults.timeout = 2000
axios.defaults.baseURL = `api`;
// axios.defaults.headers.post['Content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8'

/*
* content-type:
* 类型一application/x-www-form-urlencode 默认是form表单数据提交格式
* 类型二multipart/form-data 上传文件格式
* 类型三application/json  {"title":"test","sub":[1,2,3]} 的格式 特别适合 RESTful 的接口
* 类型四text/xml 它是一种使用 HTTP 作为传输协议，XML 作为编码方式的远程调用规范。
*
* 注意：
* 默认情况下，axios将JavaScript对象序列化为JSON。 要以application / x-www-form-urlencoded格式发送数据，您可以使用以下选项之一。
import qs from 'qs';
const data = { 'bar': 123 };
const options = {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  data: qs.stringify(data), // 这里可以使用utils/help的serialize
  url,
};
axios(options);
* */


/**
 * 发送带有cookie的请求需要带Authorization字段
 */
axios.interceptors.request.use((config) => {
    if (token) {
        config.headers['Authorization'] = getToken(tokenKey)
    }
    return config
}, (error) => {
    // Do something with request error
    return Promise.reject(error)
})


axios.interceptors.response.use((response) => {
    // Do something before response is sent
    return response
}, (error) => {
    // Do something with response error
    return Promise.reject(error)
})


const get = (url, params, config = {}) => {
    return axios['get'](url, {
            params,
            headers: config,
        }).then(handleSuccess)
        .catch(handleError)
}

/**
 * 默认是application/json,
 * 如果设置ContentType: application/x-www-form-urlencode.
 * 就要使用qs.stringify 将数据序列化一下。
 * 如果类型是multipart/form-data. 那就用FormData将数据处理一下
 */
const post = (url, data, config = {}) => {
    const contentType = config ? config['Content-Type'] : undefined;
    if (contentType) {
        if (contentType  === 'application/x-www-form-urlencoded') {
            data = qs.stringify(data)
        } else if (contentType === 'multipart/form-data') {
            if (data instanceof HTMLFormElement) {
                data = new FormData(data)
            } else {
                Promise.reject('data type is not valid of your ContentType defined')
            }
        }
    }
    return axios({
            method: 'post',
            url,
            data,
            headers: config,
        }).then(handleSuccess)
        .catch(handleError)
}

const api = {
    get,
    post,
}


export default api
