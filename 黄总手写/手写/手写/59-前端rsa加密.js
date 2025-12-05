// RSA加密算法是一种非对称加密算法。

// 对极大整数做因数分解的难度决定了RSA算法的可靠性。换言之，对一极大整数做因数分解愈困难，RSA算法愈可靠。假如有人找到一种快速因数分解的算法的话，那么用RSA加密的信息的可靠性就肯定会极度下降。但找到这样的算法的可能性是非常小的。今天只有短的RSA钥匙才可能被强力方式解破。到2016年为止，世界上还没有任何可靠的攻击RSA算法的方式。只要其钥匙的长度足够长，用RSA加密的信息实际上是不能被解破的。
// 接触到就直接谈下自己理解的RSA加密,直接贴代码比较好：

// 1.首先先安装：

// npm i jsencrypt

import JsEncrypt from 'jsencrypt'
// Vue.prototype.$jsEncrypt = JsEncrypt

function getRSApass (password) {
    let jse = new JSEncrypt()
    //公钥
    var publicString = '-----BEGIN PUBLIC KEY-----\n' +
        'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDcRie+DklCiZyRTCniB/o6kPRk\n' +
        'rRO57+cejRRrOOmoPDOrbQlOumGsNsThsShor3sgareTUiLLIdNeoV0hrTHqsFy7\n' +
        'zBFL7QDnvEaI5eYwttesOp4D7y5EM0BU2lKg7L+9FbrNgILGs6PwR97quLozmvoP\n' +
        'RSbr/J/E/+PNki5HMwIDAQAB\n' +
        '-----END PUBLIC KEY-----'
    jse.setPublicKey(publicString)
    // 加密内容
    let encrypted = jse.encrypt(password)
    return encrypted
}
// 4.具体情况下使用加密:

let pass = this.getRSApass(this.pass)
let password = this.getRSApass(this.password)


