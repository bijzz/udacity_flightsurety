// see https://knowledge.udacity.com/questions/256122
const FlightSuretyData = artifacts.require("FlightSuretyData");
const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const fs = require('fs');
module.exports = async function(deployer, network, accounts) {

  // for somplification we register first airline with contract deployment
  const firstAirlineAddress = accounts[1];
  let firstAirlineName = "Delta Air Lines"
  await deployer.deploy(FlightSuretyData, firstAirlineAddress, firstAirlineName);
  const data_contract = await FlightSuretyData.deployed();
  await deployer.deploy(FlightSuretyApp, data_contract.address);
  const app_contract = await FlightSuretyApp.deployed();
  let url = 'http://localhost:8545';
  if (network == 'ganachegui')
    url = 'http://localhost:8545';
  let config = {
    localhost: {
      url: url,
      dataAddress: data_contract.address,
      appAddress: app_contract.address
    }
  }
  
  // after deployment push contract address to dapp and server
  fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
  fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
}