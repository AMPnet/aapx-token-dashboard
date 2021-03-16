import Web3 from "web3";
import Web3Utils from "web3-utils"
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";
import aapxArtifact from "../../build/contracts/AAPX.json";
import splitterArtifact from "../../build/contracts/PaymentSplitter.json"
import vestingArtifact from "../../build/contracts/TokenVesting.json"

const AAPX_TOKEN_ADDRESS = "0x6667211fBf9D8A470749Bf87C8db25FAcebEA4Bd"

const App = {
  web3: null,
  account: null,

  // TOKEN CONTRACT
  aapx: null,

  distributors: null,
  selectedDistributor: null,
  
  start: async function() {
    const { web3 } = this;


    try {

      this.distributors = [
        {
          name: "Presale",
          vesting: new web3.eth.Contract(vestingArtifact.abi, "0x07c2fB5566c257db7C4b77515461Db43906812Ff"),
          splitter: new web3.eth.Contract(splitterArtifact.abi, "0xDe2E40AD7136207a49A5BCBaf81F5A46A9c21177")
        }
      ]
      this.selectedDistributor = this.distributors[0];

      this.aapx = new web3.eth.Contract(
        aapxArtifact.abi,
        AAPX_TOKEN_ADDRESS
      );

      var that = this;

      $.each(this.distributors, async function(index, value) {

        $("#selectVesting").append(`
          <option value="${index}">${value.name}</option>
        `)

        const { balanceOf } = that.aapx.methods;
        const vested = await balanceOf(value.vesting.options.address).call() 

        $("#vestingContractsList").append(`
          <li class="list-group-item">
            ${value.name} : <b> ${vested} </b> <b> AAPX </b>
          </li>
        `)
      })

      $(document).on('change', '#selectVesting', function() {
        const selectedValue = $("#selectVesting").find("option:selected").attr("value")
        that.selectedDistributor = that.distributors[selectedValue]
      })

      // Set accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
      
      this.showFullDash(accounts)
      await this.showBalances()
      await this.calculateClaimableAAPX()

    } catch (error) {

      Swal.fire({
        title: "Can't connect",
        text: "Something went wrong.",
        icon: 'error',
        confirmButtonText: 'Ok'
      })
      console.error(error)

    }
  },

  showFullDash: function(accounts) {
    $(".connected").show()
    $("#connectWalletButton").hide()
    $("#addressSelector").show()
    $("#addressSelect").html(this.account)
  },

  showBalances: async function() {
    const { balanceOf } = this.aapx.methods;
    const accountBalance = await balanceOf(this.account).call();
    $("#balance").html(
      Web3Utils.fromWei(accountBalance)
    )

    // this.calculateClaimableAAPX()

    // const presaleSplitterBalance = await balanceOf(PRESALE_SPLITTER_ADDRESS).call()

    // $("#presaleClaimable").html(
    //   Web3Utils.fromWei(presaleSplitterBalance)
    // )
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
    const { totalReleased, shares, released, totalShares } = this.selectedDistributor.splitter.methods;

    const contractBalance = Web3Utils.toBN(await balanceOf(this.selectedDistributor.splitter.options.address).call())
    const _totalReleased =  Web3Utils.toBN(await totalReleased().call())
    const _shares = Web3Utils.toBN(await shares(this.account).call())
    const _released = Web3Utils.toBN(await released(this.account).call())
    const _totalShares = Web3Utils.toBN(await totalShares().call())

    const _totalReceived = contractBalance.add(_totalReleased);
    const payment = _totalReceived.mul(_shares).div(_totalShares).sub(_released)

    $("#tokensAvailableToClaim").html(payment);
  },

  toggleAdvanced() {
    $("#advanced").toggle()
  },

  connectWalletClicked: async function() {

    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          infuraId: "27e484dcd9e3efcfd25a83a78777cdf1" // required
        }
      }
    }

    const web3Modal = new Web3Modal({
      network: "mainnet", // optional
      cacheProvider: true, // optional
      providerOptions // required
    });
      
    const provider = await web3Modal.connect();

    App.web3 = new Web3(provider);
  
    App.start();
  }
};

window.App = App;
