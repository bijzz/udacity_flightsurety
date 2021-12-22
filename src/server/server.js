import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import "babel-polyfill";

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

let ORACLE_ADDRESS_INDEX_START = 10;
let ORACLE_ADDRESS_INDEX_END   = 40;
let oracles = [];

async function initialize() {
  let accounts = await web3.eth.getAccounts();
  console.log(accounts);
  for (let i = ORACLE_ADDRESS_INDEX_START; i < ORACLE_ADDRESS_INDEX_END; i++) {
    console.log("Submit Oracle "+accounts[i]+" for registration.");
    let result = await flightSuretyApp.methods.registerOracle().send({from: accounts[i], value: web3.utils.toWei("1.1",'ether'), gas: 1000000});
    let oracleIndex = await flightSuretyApp.methods.getMyIndexes().call({from: accounts[i], gas: 1000000});
    let oracle = {address: accounts[i], index: oracleIndex};
    oracles.push(oracle);
  }
  console.log("Number of oracle's: "+oracles.length)
  console.log("Oracle indexes: "+JSON.stringify(oracles));
}

initialize();


flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) console.log(error)
    //console.log(event) // activate if events should be logged fully to console
    let eventvalues = event.returnValues;
    for(let i = 0; i < oracles.length; i++) {
      //console.log(index)
      //console.log(oracles[i].index)
      if(oracles[i].index.includes(eventvalues.index)) {
        // Unknown (0), On Time (10) or Late Airline (20), Late Weather (30), Late Technical (40), or Late Other (50)
        let statusCodes = [0, 10, 20, 30, 40, 50]
        let statusResponse = statusCodes[Math.floor(Math.random()*statusCodes.length)];
        let result = flightSuretyApp.methods.submitOracleResponse(eventvalues.index, eventvalues.airline, eventvalues.flight, eventvalues.timestamp, statusResponse).send({from: oracles[i].address, gas: 1000000});

      }

    }

});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


