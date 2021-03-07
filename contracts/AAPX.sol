pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/drafts/TokenVesting.sol";

contract AAPX is ERC20, ERC20Detailed {
    constructor(uint256 initialSupply) ERC20Detailed("AMPnet APX Token", "AAPX", 18) public {
        _mint(msg.sender, initialSupply);
    }
}