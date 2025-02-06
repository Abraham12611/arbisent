import { TradingParameters } from './types';

export class TradingParameterValidator {
  validateParameters(params: TradingParameters): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (params.amount !== undefined && params.amount <= 0) {
      errors.push('Trade amount must be greater than 0');
    }

    if (params.price !== undefined && params.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (params.stopLoss !== undefined && params.takeProfit !== undefined) {
      if (params.stopLoss >= params.takeProfit) {
        errors.push('Stop loss must be lower than take profit');
      }
    }

    // Add asset-specific validations
    if (params.asset) {
      if (!['SOL', 'ETH', 'BTC'].includes(params.asset.toUpperCase())) {
        errors.push('Unsupported asset');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}