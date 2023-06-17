// @ts-check
const secp = require("ethereum-cryptography/secp256k1");
const { toHex } = require("ethereum-cryptography/utils");

const privateKey = secp.utils.randomPrivateKey();
console.log({ privateKey: toHex(privateKey) });

const publicKey = secp.getPublicKey(privateKey);
console.log({
  publicKeyShorted: toHex(publicKey.slice(-20)),
  publicKey: toHex(publicKey),
});

const msgHash =
  "7b22616d6f756e74223a31302c22726563697069656e74223a22307830353134353864656662663664313465633830613937306134326538663338636436303135646430222c2273656e646572223a22307830346637343435393630636532383862336565646461643934663337616534323461313437323337227d";

secp
  .sign(msgHash, privateKey, { recovered: true })
  .then(([sigUint8Arr, recoveryNum]) => {
    const sig = toHex(sigUint8Arr);
    const senderPublicKey = secp.recoverPublicKey(msgHash, sig, recoveryNum);
    console.log({ senderPublicKey });

    const authorized = secp.verify(sig, msgHash, senderPublicKey);
    console.log({ authorized });
  });
