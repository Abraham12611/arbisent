interface Window {
  solana?: {
    isPhantom?: boolean;
    connect(): Promise<{ publicKey: { toString(): string } }>;
  };
  ethereum?: {
    isMetaMask?: boolean;
    request(args: { method: string }): Promise<string[]>;
  };
}