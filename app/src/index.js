import Web3 from "web3";
import Web3Utils from "web3-utils"
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";
import aapxArtifact from "../../build/contracts/AAPX.json";
import splitterArtifact from "../../build/contracts/PaymentSplitter.json"
import vestingArtifact from "../../build/contracts/TokenVesting.json"
import numeral from 'numeral'

const AAPX_TOKEN_ADDRESS = "0xbfD815347d024F449886c171f78Fa5B8E6790811"

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
          name: "Durty (Presale)",
          splitter: new web3.eth.Contract(splitterArtifact.abi, "0x4E9b5E0D99fA397B4169fA51f4c779c410d2569e"),
          vesting: new web3.eth.Contract(vestingArtifact.abi, "0x09f04D692F4C97D0b86fb57f81cE2346D161eA88")
        },
        {
          name: "BlackDragon (Presale)",
          splitter: new web3.eth.Contract(splitterArtifact.abi, "0xbE9f603b6D1413fC4d7B5d07ED24855bFa2B9694"),
          vesting: new web3.eth.Contract(vestingArtifact.abi, "0xd40E97C8eE6f3F0905F20f782f5407b543CFB7eD")
        },
        {
          name: "DEXT Force (Presale)",
          splitter: new web3.eth.Contract(splitterArtifact.abi, "0x57cf044E7BaDe15dDBE1024CA9c3B0e2e6746929"),
          vesting: new web3.eth.Contract(vestingArtifact.abi, "0x2A707746959dCBefFAb19F1488E936d2b688bA87")
        },
        {
          name: "DuckDAO Group 1 (Presale)",
          splitter: new web3.eth.Contract(splitterArtifact.abi, "0x8D64B643C935B428b866fD8714f47F7405DC1dC8"),
          vesting: new web3.eth.Contract(vestingArtifact.abi, "0x093B53EdCD2Dc76166Ca66ED33FE472C45C5A80F")
        },
        {
          name: "DuckDAO Group 2 (Presale)",
          splitter: new web3.eth.Contract(splitterArtifact.abi, "0xdcA870818AE9BABac5EFc5886Fbbb3770e24da00"),
          vesting: new web3.eth.Contract(vestingArtifact.abi, "0x29573e8Ef5a4446F4167c7a41e418e5CC4d65a21")
        },
        {
          name: "DuckDAO Group 3 (Presale)",
          splitter: new web3.eth.Contract(splitterArtifact.abi, "0xD1a6D01a4939192246054Ee74Bfa53734cc9f0e7"),
          vesting: new web3.eth.Contract(vestingArtifact.abi, "0x8154D878DA0Bf4a6694Eedc722809cEF92fe8c04")
        },
        {
          name: "Private Group 1 (Presale)",
          splitter: new web3.eth.Contract(splitterArtifact.abi, "0x44BA40CF2e9B84A9460068b8059b90903d17E1c3"),
          vesting: new web3.eth.Contract(vestingArtifact.abi, "0xf6494a61E66618B70C87A664FB69F002DF29cF53")
        },
        {
          name: "Private Group 2 (Presale)",
          splitter: new web3.eth.Contract(splitterArtifact.abi, "0x28663425a3e4425b6b54ef72d1dffd82663c3f06"),
          vesting: new web3.eth.Contract(vestingArtifact.abi, "0x0d87f41be645fb600de129f91e9ccad9e3b2688d")
        },
        {
          name: "The Crypto Lifestyle 1 (Seed)",
          splitter: new web3.eth.Contract(splitterArtifact.abi, "0x0e791a78b0f530b9ad62bcab658b4f508dc891a9"),
          vesting: new web3.eth.Contract(vestingArtifact.abi, "0x96748459e1af603421caefd7665ed5d08a15027a")
        },
        {
          name: "BlackDragon (Seed)",
          splitter: new web3.eth.Contract(splitterArtifact.abi, "0x377b768810d856b50c737bc72aa34541e14bcb60"),
          vesting: new web3.eth.Contract(vestingArtifact.abi, "0xb560d231e606f547793699cea81a019513308be3")
        },
        {
          name: "The Crypto Lifestyle 2 (Seed)",
          splitter: new web3.eth.Contract(splitterArtifact.abi, "0xf966fd3f22fe4988f63074b6d37ccfe2ad5e0338"),
          vesting: new web3.eth.Contract(vestingArtifact.abi, "0x7a084e2318be17f9fc98171ca93107f3d9546030")
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
        const vested = App.fromWeiAndRoundDown(await balanceOf(value.splitter.options.address).call())

        const coldVest = App.fromWeiAndRoundDown(await balanceOf(value.vesting.options.address).call())
        
        const myVested = App.fromWeiAndRoundDown(await that.calculateClaimableAAPX(value))

        $("#vestingContractsList").append(`
          <tr>
            <td>${value.name} AAPX</td> 
            <td>${vested} AAPX</td>
            <td>${myVested} AAPX</td>
            <td>${coldVest} AAPX</td>
          </tr>
        `)
      })

      var that;
      $(document).on('change', '#selectVesting', async function() {
        const selectedValue = $("#selectVesting").find("option:selected").attr("value")
        that.selectedDistributor = that.distributors[selectedValue]
        

        $("#tokensAvailableToClaim").html(
          App.fromWeiAndRoundDown(await that.calculateClaimableAAPX(that.selectedDistributor)) + " AAPX"
        );
      })

      // Set accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
      
      this.showFullDash(accounts)
      
      const availableToClaim = await that.calculateClaimableAAPX(this.selectedDistributor)

      $("#tokensAvailableToClaim").html(
        App.fromWeiAndRoundDown(availableToClaim) + " AAPX"
      );

      await this.showBalances()

    } catch (error) {

      Swal.fire({
        title: "Can't connect",
        text: "Something went wrong. Check your network in MetaMask, it should be Mainnet. Check if you are connecting with an actual vesting address - nonvesting addreses cannot connect to the portal.",
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
      App.fromWeiAndRoundDown(accountBalance) + " AAPX"
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

  fromWeiAndRoundDown(amount) {
    return numeral(Math.round(Web3Utils.fromWei(amount) * 10000) / 10000).format("0,0.0000")
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
