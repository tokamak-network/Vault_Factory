import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100,
      },
    },
  },
  networks: {
    hardhat: {
      // allowUnlimitedContractSize: true,
      forking: {
        url: "https://eth-rinkeby.alchemyapi.io/v2/HcHq2tP2MKaf_Evx-_YS_t8GLoHfEj-h",
      },
    },
    local: {
      chainId: 31337,
      url: `http://127.0.0.1:8545/`,
      accounts: [
        `${process.env.PRIVATE_KEY}`,`${process.env.PRIVATE_KEY_2}`,`${process.env.PRIVATE_KEY_3}`,
        `${process.env.PRIVATE_KEY_4}`,`${process.env.PRIVATE_KEY_5}`,`${process.env.PRIVATE_KEY_6}`,
        `${process.env.PRIVATE_KEY_7}`,`${process.env.PRIVATE_KEY_8}`,`${process.env.PRIVATE_KEY_9}`,
        `${process.env.PRIVATE_KEY_10}`, `${process.env.PRIVATE_KEY_11}`, `${process.env.PRIVATE_KEY_12}`],
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [ `${process.env.RINKEBY_PRIVATE_KEY}` ]
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
