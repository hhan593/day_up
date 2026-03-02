/**
 * @description 手写 jsonp
 * @author 氧化氢
 */

 const jsonp = ({url, params, callbackName}) => {
  const getUrl = () => {
    let dataSrc = ''
    for(var key in params) {
      if(params.hasOwnProperty(key)) {
        dataSrc += `${key}=${params[key]}&`
      }
    }
    dataSrc += `callbackName=${callbackName}`
    return `${url}?${dataSrc}`
  }
  return new Promise((resolve, reject) => {
    const scriptEle = document.createElement('script')
    scriptEle.src = getUrl()
    document.body.appendChild(scriptEle)
    window[callbackName] = data => {
      resolve(data)
      document.body.removeChild(scriptEle)
    }
  })
}