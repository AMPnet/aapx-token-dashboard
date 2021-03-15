import Web3 from "web3";
import Web3Utils from "web3-utils"
import aapxArtifact from "../../build/contracts/AAPX.json";
import splitterArtifact from "../../build/contracts/PaymentSplitter.json"
import vestingArtifact from "../../build/contracts/TokenVesting.json"

const AAPX_TOKEN_ADDRESS = "0x6667211fBf9D8A470749Bf87C8db25FAcebEA4Bd"

// PRESALE
const PRESALE_VESTING_ADDRESS = "0x07c2fB5566c257db7C4b77515461Db43906812Ff"
const PRESALE_SPLITTER_ADDRESS = "0xDe2E40AD7136207a49A5BCBaf81F5A46A9c21177"

const App = {
  web3: null,
  account: null,

  // TOKEN CONTRACT
  aapx: null,

  // PRESALE
  presaleSplitter: null,
  presaleVesting: null,

  // SEED SALE
  seedSplitter: null,
  seedVesting: null,

  // TEAM
  teamSplitter: null,
  teamVesting: null,

  start: async function() {
    const { web3 } = this;

    try {

      // Initialize contracts
      this.aapx = new web3.eth.Contract(
        aapxArtifact.abi,
        AAPX_TOKEN_ADDRESS
      );

      this.presaleSplitter = new web3.eth.Contract(
        splitterArtifact.abi,
        PRESALE_SPLITTER_ADDRESS
      )

      this.presaleVesting = new web3.eth.Contract(
        vestingArtifact.abi,
        PRESALE_VESTING_ADDRESS
      )

      // Set accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
      
      this.showFullDash(accounts)
      await this.showBalances()

    } catch (error) {

      Swal.fire({
        title: 'Error!',
        text: error,
        icon: 'error',
        confirmButtonText: 'Ok'
      })

    }
  },

  showFullDash: function(accounts) {
    $(".connected").show()
    $("#connectWalletButton").hide()
    $("#addressSelector").show()
    $.each(accounts, function(index, value) {
      $("#addressSelect").append(`<option>${value}</option>`)
    })
  },

  showBalances: async function() {
    const { balanceOf } = this.aapx.methods;
    const accountBalance = await balanceOf(this.account).call();
    $("#balance").html(
      Web3Utils.fromWei(accountBalance)
    )

    this.calculateClaimableAAPX()

    const presaleSplitterBalance = await balanceOf(PRESALE_SPLITTER_ADDRESS).call()

    $("#presaleClaimable").html(
      Web3Utils.fromWei(presaleSplitterBalance)
    )
  },

  releaseVesting: async function() {

    const { release } = this.presaleVesting.methods;

    release(AAPX_TOKEN_ADDRESS).send({ from: this.account }).on('transactionHash', function(hash) {
      Swal.fire({
        title: 'Transaction Sent',
        text: "https://etherscan.io/tx/" + hash,
        icon: 'info',
        confirmButtonText: 'Ok'
      })
    }).on('receipt', function(confNumber, receipt) {
      Swal.fire({
        title: 'Success!',
        text: 'Vesting released',
        icon: 'success',
        confirmButtonText: 'Ok'
      })
      this.showBalances()
    }).on('error', function(error, receipt) {
      Swal.fire({
        title: 'Error!',
        text: "Transaction failed. Possible causes: No tokens left to release, not enough ETH on account, transaction rejected by caller",
        icon: 'error',
        confirmButtonText: 'Ok'
      })
    })
  },

  releasePaymentSplitter: async function() {

      const { release } = this.presaleSplitter.methods;
      release(this.account).send({ from: this.account }).on('transactionHash', function(hash) {

        Swal.fire({
          title: 'Transaction Sent',
          text: 'Tx hash: ' + hash,
          icon: 'info',
          confirmButtonText: 'Ok'
        })

      }).on('receipt', function(confirmationNumber, receipt) {

        Swal.fire({
          title: 'Success!',
          text: 'Vesting released',
          icon: 'success',
          confirmButtonText: 'Ok'
        })
        this.showBalances()

      }).on('error', function(err, receipt) {

        Swal.fire({
          title: 'Error!',
          text: 'Error calling function. Possible causes: No tokens to distribute; Not enough ETH on your wallet',
          icon: 'error',
          confirmButtonText: 'Ok'
        })

      })

  },

  calculateClaimableAAPX: async function() {

    const { balanceOf } = this.aapx.methods;
    const { totalReleased, shares, released, totalShares } = this.presaleSplitter.methods;

    const contractBalance = Web3Utils.toBN(await balanceOf(PRESALE_SPLITTER_ADDRESS).call())
    const _totalReleased =  Web3Utils.toBN(await totalReleased().call())
    const _shares = Web3Utils.toBN(await shares(this.account).call())
    const _released = Web3Utils.toBN(await released(this.account).call())
    const _totalShares = Web3Utils.toBN(await totalShares().call())

    const _totalReceived = contractBalance.add(_totalReleased);
    const payment = _totalReceived.mul(_shares).div(_totalShares).sub(_released)

    $("#claimableTokens").html(
      Web3Utils.fromWei(payment)
    )
  },

  toggleAdvanced() {
    $("#advanced").toggle()
  },

  connectWalletClicked: function() {
    if (window.ethereum) {
      // use MetaMask's provider
      App.web3 = new Web3(window.ethereum);
      window.ethereum.enable(); // get permission to access accounts
    } else {
      Swal.fire({
        title: 'Error!',
        text: 'Please use a browser with a Web3/Ethereum Wallet Support (e.g. MetaMask in Chrome/Firefox or Brave Browser)',
        icon: 'info',
        confirmButtonText: 'Ok'
      })
    }
  
    App.start();
  }
};

window.App = App;
