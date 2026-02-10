function deepCopy(obj) {
  if(typeof obj !== 'object') return
  const newObj = Array.isArray(obj) ? [] : {}
  for(let key in obj) {
    if(obj.hasOwnProperty(key)) {
      newObj[key] = typeof obj[key] === 'object' ? deepCopy(obj[key]) : obj[key] 
    }
  }

  return newObj
}