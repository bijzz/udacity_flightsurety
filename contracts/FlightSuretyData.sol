pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    enum Membership {REGISTERED, VOTER}

    struct AirlinePool {
        string name;
        uint256 fund; 
        Membership state;
        bool exists;
        address[] multiCalls;
        //bool hasFund; // equal to fund != 0 - funds can be used up by insurance, still fund keeps history
    }

    // registered and funded airlines count
    uint256 numberOfVoters;

    mapping(address => bool) private authorizedCallers;
    mapping(address => AirlinePool) private airlines;
    //mapping(address => uint256) airlineFunds;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                    address _firstAirlineAddress,
                                    string _firstAirlineName
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        numberOfVoters = 0;
        // add first airline
        airlines[_firstAirlineAddress] =  AirlinePool(_firstAirlineName, 0, Membership.REGISTERED, true, new address[](0));
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
    * @dev Modifier that requires the "Authorized Caller" account to be the function caller
    * This should be the application contract(s) allowed to call the data contract.
    */
    modifier requireAuthorizedCaller()
    {
        require(isAuthorizedCaller(msg.sender), "Caller is not authorized to use data contract");
        _;
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireVoter()
    {
        require(airlines[msg.sender].state == Membership.VOTER, "Caller is not a voter");
        _;
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireNotRegistered()
    {
        require(!airlines[msg.sender].exists, "Airline is already registered");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool _mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = _mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function getAirlineState(address _airlineAddress) public view returns (uint8){
        return uint8(airlines[_airlineAddress].state);
    }

    function doesAirlineExist(address _airlineAddress) public view returns (bool){
        return airlines[_airlineAddress].exists;
    }

    function getNumberOfVoters() public view returns (uint256) {
        return numberOfVoters;
    }

    function addVoteForAirline(address _airlineAddress, address _voterAddress) public {

        bool isDuplicate = false;
        for(uint c=0; c<airlines[_airlineAddress].multiCalls.length; c++) {
            if (airlines[_airlineAddress].multiCalls[c] ==_voterAddress) {
                isDuplicate = true;
                break;
            }
        }
        require(!isDuplicate, "Vote has already been given.");

        airlines[_airlineAddress].multiCalls.push(_voterAddress);

    }

    function getNumberOfVotes(address _airlineAddress) public view returns (uint256) {
        return airlines[_airlineAddress].multiCalls.length;
    }

    function isAirline(
                        address _airlineAddress
                      )
                      public
                      view
                      requireAuthorizedCaller
                      returns(bool)
    {
       if (airlines[_airlineAddress].exists) {
           return airlines[_airlineAddress].state == Membership.VOTER;
       } else {
           return false;
       }
        //return airlines[_airlineAddress].exists;
    }

    function authorizeCaller(address _address) 
                            external
                            requireContractOwner 
    {
        authorizedCallers[_address] = true;
    }

    function isAuthorizedCaller(
                                    address _address
                               )
                               internal
                               view
                               returns(bool)
    {
        return authorizedCallers[_address] == true;
    }

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
                            (   
                                address _airlineAddress, 
                                string _airlineName
                            )
                            external
                            requireIsOperational
                            requireAuthorizedCaller
                            //requireNotRegistered
    {
        // Membership(_state)
        //if (Membership(_state) = Membership.REGISTERED) {
        if(!airlines[msg.sender].exists) airlines[_airlineAddress] = AirlinePool(_airlineName, 0, Membership.REGISTERED, true, new address[](0));
       // }
        

    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
                            (                             
                            )
                            external
                            payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                )
                                external
                                pure
    {
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                            )
                            external
                            pure
    {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            (   
                                address _airlineAddress
                            )
                            //requireIsOperational
                            //requireAuthorizedCaller
                            public
                            payable
    {
        require(airlines[_airlineAddress].exists, "Airline needs to in airline pool before it is allowed to fund");

        // keep internal balance
        uint256 balance = airlines[_airlineAddress].fund;
        airlines[_airlineAddress].fund = balance.add(msg.value);
        // if airline funds for the first time
        if (airlines[_airlineAddress].state == Membership.REGISTERED) {
            airlines[_airlineAddress].state = Membership.VOTER;
            numberOfVoters=numberOfVoters.add(1);
        }

    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // /**
    // * @dev Fallback function for funding smart contract.
    // *
    // */
    // function() 
    //                         external 
    //                         payable 
    // {
    //     fund();
    // }


}

