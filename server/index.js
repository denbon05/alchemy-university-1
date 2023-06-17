// @ts-check
const secp = require("ethereum-cryptography/secp256k1");
const { toHex, utf8ToBytes } = require("ethereum-cryptography/utils");
const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

/**
 * Example users' public addresses with commented private keys.
 */
const balances = {
  // a8559a8d9038a7ae17cf86f646ed44634465c03d0c2ea2b68a1018e0dc95f0df
  "0xc22ffe845160412b9e4387d84977600de8b9bad6": 100,
  // 050e8345708070e39474f38950aa7225b348c36cb03449f52b79a51ee79ad4fc
  "0x74bcf7a63b80e99f32f1b4fc6c9147a332f1ec8c": 50,
  // 355df53afa8e1d97505683f6056b39b7afcf6cd28d9963d3ef4f582d70491321
  "0x051458defbf6d14ec80a970a42e8f38cd6015dd0": 75,
};

/**
 * Check if the user is authorized and who he claims to be.
 * @param {{ sender: string, signature: string,recoveryNum: number,msgHash: string}} data
 * @returns {boolean}
 */
const verifySender = ({
  // sender address is already in shorted format
  sender: senderAddress,
  signature,
  recoveryNum,
  msgHash,
}) => {
  const senderPublicKey = secp.recoverPublicKey(
    msgHash,
    signature,
    recoveryNum,
  );
  // console.log({ senderPublicKey: toHex(senderPublicKey) });
  const authorized = secp.verify(signature, msgHash, senderPublicKey);

  if (!authorized) {
    return false;
  }

  // cut and normalize public key
  const actualPubKeySliced = senderPublicKey.slice(-20);
  const actualPubKeyNormalized = `0x${toHex(actualPubKeySliced)}`;
  // console.log({ senderAddress, actualPubKeyNormalized });
  return actualPubKeyNormalized === senderAddress;
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  // derive signature from public address
  // make sure only owner can send own funds
  const { recipient, sender, amount, signature, recoveryNum, msgHash } =
    req.body;
  const isTransferLegit = verifySender({
    sender,
    signature,
    msgHash,
    recoveryNum,
  });
  // console.log({ isTransferLegit });

  if (!isTransferLegit) {
    return res.status(403).send({ message: "Forbidden" });
  }

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
