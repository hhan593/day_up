/**
 * @description 解析 Url
 * @author 氧化氢
 */

 function parseUrl(url) {
  if(!url.includes('?')) return {}
  var params = url.split('?')[1]
  if(!params.includes('&')) {
    let obj = {}
    let [key, value] = item.split('=')
    obj[key] = decodeURIComponent(value)

    return obj
  } else {
    const arr = params.split('&')
    const obj = {}
    let key, value
    arr.forEach(item => {
      [key, value] = item.split('=')
      obj[key] = decodeURIComponent(value)
    })

    return obj
  }
}

console.log(parseUrl('https://www.nowcoder.com/interview/ai/cover?companyTagId=665&age=100&name=liuhao'));