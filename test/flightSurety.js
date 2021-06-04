
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

//   it(`(multiparty) has correct initial isOperational() value`, async function () {

//     // Get operating status
//     let status = await config.flightSuretyData.isOperational.call();
//     assert.equal(status, true, "Incorrect initial operating status value");

//   });

//   it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

//       // Ensure that access is denied for non-Contract Owner account
//       let accessDenied = false;
//       try 
//       {
//           await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
//       }
//       catch(e) {
//           accessDenied = true;
//       }
//       assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
//   });

//   it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

//       // Ensure that access is allowed for Contract Owner account
//       let accessDenied = false;
//       try 
//       {
//           await config.flightSuretyData.setOperatingStatus(false);
//       }
//       catch(e) {
//           accessDenied = true;
//       }
//       assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
//   });

//   it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

//       await config.flightSuretyData.setOperatingStatus(false);

//       let reverted = false;
//       try 
//       {
//           await config.flightSurety.setTestingMode(true);
//       }
//       catch(e) {
//           reverted = true;
//       }
//       assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

//       // Set it back for other tests to work
//       await config.flightSuretyData.setOperatingStatus(true);

//   });

  it('(airline) airline contract initialization - validate first airline after contract deployment ', async () => {
        
    // ARRANGE
    let state = await config.flightSuretyData.doesAirlineExist.call(accounts[1]); 

    // ASSERT
    assert.equal(state, true, "Airline should be registered after contract deployment");

  });

  it('(airline) airline ante - can not fund if not registered', async () => {
      
      // ARRANGE
      let newAirline = accounts[2];
      let balance = web3.utils.toWei("1", "ether");
      let reverted = false;

      // ACT
      try {
      await config.flightSuretyApp.fund({from: newAirline, value: balance});
      } catch(e) {
          reverted = true;
      }

      // ASSERT
      assert.equal(reverted, true, "Airline funding is not blocked even though it is not yet registered");

  });

  
  it('(airline) airline ante - cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, "Emirates Airline", {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyApp.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('(airline) airline ante - can fund if registered', async () => {
      
    // ARRANGE
    //let newAirline = accounts[2];
    let balance = web3.utils.toWei("10", "ether");
    let sender = accounts[1];
    let reverted = false;

    // ACT
    try {
    // fund
    await config.flightSuretyApp.fund({from: sender, value: balance});
    } catch(e) {
        reverted = true;
        console.log("OHMY")
        console.log(e)
    }
    let state = await config.flightSuretyData.getAirlineState.call(sender); 

    // ASSERT
    assert.equal(reverted, false, "Airline funding did not work");
    assert.equal(state, 1, "Airline should be in State 1=VOTER");

});
 
it('(airline) multi party consensus - funded airline can register a new airline | members <= 4 members', async () => {
    
  // ARRANGE
  let newAirline = accounts[2];

  // ACT
  try {
      await config.flightSuretyApp.registerAirline(newAirline, "Emirates Airline", {from: config.firstAirline});
  }
  catch(e) {

  }
  let result = await config.flightSuretyData.getAirlineState.call(newAirline); 

  // ASSERT
  assert.equal(result, 0, "Airline should be in State 0=REGISTERED");

});


it('(airline) multi party consensus - funded airline can register a new airline | members > 4 members', async () => {
    
  // ARRANGE
  let airline1 = accounts[1];
  let airline2 = accounts[2];
  let airline3 = accounts[3];
  let airline4 = accounts[4];
  let airline5 = accounts[5];
  let airline6 = accounts[6];
  let balance = web3.utils.toWei("10", "ether");

  await config.flightSuretyApp.fund({from: airline1, value: balance});
  await config.flightSuretyApp.registerAirline(airline2, "Emirates Airline", {from: airline1});
  await config.flightSuretyApp.registerAirline(airline2, "Emirates Airline", {from: airline1});
  await config.flightSuretyApp.registerAirline(airline2, "Emirates Airline", {from: airline1});
  await config.flightSuretyApp.fund({from: airline2, value: balance});
  await config.flightSuretyApp.registerAirline(airline3, "Saudi Arabian Airlines", {from: airline2});
  await config.flightSuretyApp.fund({from: airline3, value: balance});
  await config.flightSuretyApp.registerAirline(airline4, "Cathay Pacific", {from: airline3});
  await config.flightSuretyApp.fund({from: airline4, value: balance});

  let numberVotes = await config.flightSuretyData.getNumberOfVoters();
  var register = await config.flightSuretyApp.registerAirline.call(airline5, "Cathay Pacific", {from: airline3}); // .call is needed to fetch return values
  registerStatus = register[0];
  registerVotes = register[1];

  await config.flightSuretyApp.addVoteForAirline(airline5, {from: airline1});
  await config.flightSuretyApp.addVoteForAirline(airline5, {from: airline4});

  let votesForairline5 = await config.flightSuretyData.getNumberOfVotes.call(airline5);

  var finalRegister = await config.flightSuretyApp.registerAirline.call(airline5, "Cathay Pacific", {from: airline3});
  finalRegisterStatus = finalRegister[0];
  finalRegisterVotes = finalRegister[1];

  // ASSERT
  assert.equal(numberVotes, 4, "We should have four funded and thereby vote eligible members");
  assert.equal(registerStatus, false, "Registration should fail with no vote");
  assert.equal(registerVotes, 0, "There should not yet have been any vote");
  assert.equal(finalRegisterStatus, true, "Registration should succed with 2 votes ( min votes = 4 *0.5 )");
  assert.equal(votesForairline5, 2, "Two votes should have been placed for airline5")
  assert.equal(finalRegisterVotes, 2, "Two votes should have been placed");
  

});
 

});
