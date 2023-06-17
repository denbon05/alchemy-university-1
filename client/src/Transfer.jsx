import { useState } from "react";
import server from "./server";
import * as secp from "ethereum-cryptography/secp256k1";
import { utf8ToBytes, toHex } from "ethereum-cryptography/utils";
console.log({ secp });
// Client private key sample.
const PRIVATE_KEY =
  "a8559a8d9038a7ae17cf86f646ed44634465c03d0c2ea2b68a1018e0dc95f0df";

function Transfer({ address, setBalance }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();
    const transferData = {
      amount: parseInt(sendAmount),
      recipient,
      sender: address,
    };
    const msgHash = toHex(utf8ToBytes(JSON.stringify(transferData)));
    const [sigUint8Arr, recoveryNum] = await secp.sign(msgHash, PRIVATE_KEY, {
      recovered: true,
    });

    try {
      const {
        data: { balance },
      } = await server.post(`send`, {
        ...transferData,
        signature: toHex(sigUint8Arr),
        recoveryNum,
        msgHash,
      });
      setBalance(balance);
    } catch (ex) {
      console.error(ex);
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="Type amount"
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
