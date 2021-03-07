import Web3 from "web3";

const App = {
  web3: null,
  account: null,
  meta: null,

  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];

      $(".connected").show()
      $("#connectWalletButton").hide()
      $("#addressSelector").show()
      $.each(accounts, function(index, value) {
        $("#addressSelect").append(`<option>${value}</option>`)
      })
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },

  connectWalletClicked: function() {
    if (window.ethereum) {
      // use MetaMask's provider
      App.web3 = new Web3(window.ethereum);
      window.ethereum.enable(); // get permission to access accounts
    } else {
      alert("Please use a browser with Web3/Ethereum Support (e.g. Brave Browser or MetaMask in Chrome/Firefox)")
    }
  
    App.start();
  }
};

window.App = App;
