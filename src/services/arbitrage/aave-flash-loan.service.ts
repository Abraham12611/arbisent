import { 
  Contract,
  providers,
  utils,
  type Signer
} from 'ethers';
import { ArbitrageOpportunity } from './arbitrage.service';

const AAVE_POOL_ABI = [
  "function flashLoan(address receiverAddress, address[] calldata assets, uint256[] calldata amounts, uint256[] calldata modes, address onBehalfOf, bytes calldata params, uint16 referralCode)",
];

export class AaveFlashLoanService {
  private provider: providers.JsonRpcProvider;
  private signer: Signer;
  private poolContract: Contract;

  constructor(
    provider: providers.JsonRpcProvider,
    signer: Signer,
    poolAddress: string
  ) {
    this.provider = provider;
    this.signer = signer;
    this.poolContract = new Contract(poolAddress, AAVE_POOL_ABI, signer);
  }

  async executeFlashLoan(opportunity: ArbitrageOpportunity): Promise<string> {
    try {
      const [baseToken, quoteToken] = opportunity.pair.split('/');
      
      const loanAmount = utils.parseUnits(
        opportunity.minAmount.toString(),
        18
      );

      const assets = [baseToken];
      const amounts = [loanAmount];
      const modes = [0];
      const onBehalfOf = await this.signer.getAddress();
      
      // Use utils.defaultAbiCoder for encoding parameters
      const params = utils.defaultAbiCoder.encode(
        ["address", "address", "uint256", "uint256"],
        [
          opportunity.buyFrom.dex,
          opportunity.sellAt.dex,
          opportunity.buyFrom.price,
          opportunity.sellAt.price
        ]
      );

      const tx = await this.poolContract.flashLoan(
        onBehalfOf,
        assets,
        amounts,
        modes,
        onBehalfOf,
        params,
        0
      );

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Flash loan execution failed:', error);
      throw error;
    }
  }

  async estimateGas(opportunity: ArbitrageOpportunity): Promise<bigint> {
    try {
      const [baseToken, quoteToken] = opportunity.pair.split('/');
      const loanAmount = utils.parseUnits(
        opportunity.minAmount.toString(),
        18
      );

      const gas = await this.poolContract.flashLoan.estimateGas(
        await this.signer.getAddress(),
        [baseToken],
        [loanAmount],
        [0],
        await this.signer.getAddress(),
        '0x',
        0
      );

      return gas;
    } catch (error) {
      console.error('Gas estimation failed:', error);
      throw error;
    }
  }
} 