import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import { abi } from "./utils/WavePortal.json";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [msg, setMsg] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const contractAddress = "0x7Ee8a1cDe62d295E5222B3303c065B1d5E262b14";
  const contractABI = abi;


  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();


        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }


  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(msg,{ gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
      getAllWaves();
    } catch (error) {
      console.log(error);
    }
  }

  /**
 * Listen in for emitter events!
 */
useEffect(() => {
  let wavePortalContract;

  const onNewWave = (from, timestamp, message) => {
    console.log("NewWave", from, timestamp, message);
    setAllWaves(prevState => [
      ...prevState,
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
      },
    ]);
  };

  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
    wavePortalContract.on("NewWave", onNewWave);
  }

  return () => {
    if (wavePortalContract) {
      wavePortalContract.off("NewWave", onNewWave);
    }
  };
});


  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])
  useEffect(() => {
    getAllWaves();
  })

  return (
    <div className="mainContainer" style={{}}>
      <div className="dataContainer">
        <div style={{ fontSize: "6rem", display: "flex", justifyContent: "center" }}>
          <span role="img" aria-label="Wave">👋</span>
        </div>
        <div className="header bio">
          Welcome to the Wave Portal!
        </div>

        <div className="bio" style={{ fontSize: "1.5rem", color: "#ffffff", margin: "2rem" }}>
          gm!<span role="img" aria-label="Wave">👋</span>, I am Udhaykumar from india, Connect your Ethereum wallet and wave at me!
        </div>

        <div className="box">
          <input type="text" value={msg} onChange={e => setMsg(e.target.value)} placeholder="Type your message"></input>
          <button className="bx bx-copy" onClick={wave}><span role="img" aria-label="Wave">👋</span></button>
        </div>

        {/* <input type="text" value={msg} onChange={e => setMsg(e.target.value)} placeholder="Type your message"></input>
        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button> */}

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px",borderRadius:"8px" }}>
              <div style={{ fontSize: "2rem" }}><span role="img" aria-label="Message">💬</span>Message: {wave.message}</div>
              <div><span role="img" aria-label="Address">🏠</span>Address: {wave.address}</div>
              <div><span role="img" aria-label="Time">📅</span>Time: {wave.timestamp.toString()}</div>
            </div>)
        })}
      </div>
    </div>
  );

}

export default App
