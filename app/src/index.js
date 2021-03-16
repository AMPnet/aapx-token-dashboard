import Web3 from "web3";
import Web3Utils from "web3-utils"
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";
import aapxArtifact from "../../build/contracts/AAPX.json";
import splitterArtifact from "../../build/contracts/PaymentSplitter.json"
import vestingArtifact from "../../build/contracts/TokenVesting.json"

const AAPX_TOKEN_ADDRESS = "0xCA7a6599be1e5215256DA44d2dd7894b0cac9b0e"

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
          vesting: new web3.eth.Contract(vestingArtifact.abi, "0xC14F080B29929516D2922977C73902F38e6345c9"),
          splitter: new web3.eth.Contract(splitterArtifact.abi, "0x0059550f5a18a3454e4299c39C24e59990659744")
        },
        {
          name: "TCL Seed Sale",
          vesting: new web3.eth.Contract(vestingArtifact.abi, "0x9d2D924CDAb332ED4D70153DC8e6516e05F45791"),
          splitter: new web3.eth.Contract(splitterArtifact.abi, "0xeC36638eDc05A6D6a6E66df6ec1b074E2851352E")
        },
        {
          name: "BlackDragon Round 2",
          vesting: new web3.eth.Contract(vestingArtifact.abi, "0x6FBCC9Ce8bFBc08573D8d0f9014c240d4325FEbb"),
          splitter: new web3.eth.Contract(splitterArtifact.abi, "0x6769Fd40bAc5d41DCfC1115F71C9B2F08794e864")
        },
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
        const vested = Web3Utils.fromWei(await balanceOf(value.splitter.options.address).call())

        
        const myVested = Web3Utils.fromWei(await that.calculateClaimableAAPX(value))

        $("#vestingContractsList").append(`
          <li class="list-group-item">
            Name: ${value.name} <br> Total claimable: <b> ${vested} </b> <b> AAPX </b> <br> My claimable: <b> ${myVested} AAPX</b>
          </li>
        `)
      })

      $(document).on('change', '#selectVesting', async function() {
        const selectedValue = $("#selectVesting").find("option:selected").attr("value")
        that.selectedDistributor = that.distributors[selectedValue]
        

        $("#tokensAvailableToClaim").html(
          Web3Utils.fromWei(await that.calculateClaimableAAPX(this.selectedDistributor)) + " AAPX"
        );
      })

      // Set accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
      
      this.showFullDash(accounts)
      
      const availableToClaim = await that.calculateClaimableAAPX(this.selectedDistributor)

      $("#tokensAvailableToClaim").html(
        Web3Utils.fromWei(availableToClaim) + " AAPX"
      );

      await this.showBalances()

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
    $("#myBalance").html(
      Web3Utils.fromWei(accountBalance) + " AAPX"
    )
  },

  releaseVesting: async function() {

    const { release } = this.selectedDistributor.vesting.methods;

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

      const { release } = this.selectedDistributor.splitter.methods;
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
      }).on('error', function(err, receipt) {
        Swal.fire({
          title: 'Error!',
          text: 'Error calling function. Possible causes: No tokens to distribute; Not enough ETH on your wallet',
          icon: 'error',
          confirmButtonText: 'Ok'
        })
      })

  },

  calculateClaimableAAPX: async function(distributor) {

    const { balanceOf } = this.aapx.methods;
    const { totalReleased, shares, released, totalShares } = distributor.splitter.methods;

    const contractBalance = Web3Utils.toBN(await balanceOf(distributor.splitter.options.address).call())
    const _totalReleased =  Web3Utils.toBN(await totalReleased().call())
    const _shares = Web3Utils.toBN(await shares(this.account).call())
    const _released = Web3Utils.toBN(await released(this.account).call())
    const _totalShares = Web3Utils.toBN(await totalShares().call())

    const _totalReceived = contractBalance.add(_totalReleased);
    const payment = _totalReceived.mul(_shares).div(_totalShares).sub(_released)

    return payment;
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
