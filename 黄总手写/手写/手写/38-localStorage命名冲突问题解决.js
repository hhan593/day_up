// condig.js
// export default {
//     APP_NAME: 'new-electric-bicycle-web', // 工程名  
// }



// storage.js
import Config from '../../config'
const prefix = Config.APP_NAME;
export default {
    get (key) {
        key = `${prefix}-${key}`
        let value = localStorage.getItem(key)
        if (!value) {
            return null
        }
        return JSON.parse(value)
    },
    set (key, value) {
        key = `${prefix}-${key}`
        localStorage.setItem(key, JSON.stringify(value))
    },
    remove (key) {
        key = `${prefix}-${key}`
        localStorage.removeItem(key)
    },
    clear () {
        let len = localStorage.length
        let keys = []
        for (let i = 0; i < len; i++) {
                let key = localStorage.key(i)
                if (key && key.startsWith(prefix)) {
                    keys.push(key)
                }
        }
        keys.map(key => localStorage.removeItem(key))
    },
}