import { Keypair, Connection, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createTransferCheckedInstruction, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { EncryptionService } from './encryption';

export class EscrowService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );
  }

  // Generate new escrow wallet for challenge
  static async createEscrowWallet(): Promise<{
    publicKey: string;
    encryptedSecretKey: string;
  }> {
    const keypair = Keypair.generate();
    const encryptedSecretKey = await EncryptionService.encrypt(
      Buffer.from(keypair.secretKey).toString('base64')
    );

    return {
      publicKey: keypair.publicKey.toBase58(),
      encryptedSecretKey,
    };
  }

  // Fund escrow with VYRAL tokens
  async fundEscrow(
    encryptedSecretKey: string,
    tokenMint: string,
    amount: number,
    ownerPublicKey: string,
    ownerSecretKeyBase64: string
  ): Promise<string> {
    const secretKey = await EncryptionService.decrypt(encryptedSecretKey);
    const escrowKeypair = Keypair.fromSecretKey(Buffer.from(secretKey, 'base64'));

    const mintPublicKey = new PublicKey(tokenMint);
    const ownerPubKey = new PublicKey(ownerPublicKey);
    const escrowPubKey = escrowKeypair.publicKey;

    const ownerKeypair = Keypair.fromSecretKey(Buffer.from(ownerSecretKeyBase64, 'base64'));

    // Get or create token accounts
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      ownerKeypair,
      mintPublicKey,
      ownerPubKey
    );

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      escrowKeypair,
      mintPublicKey,
      escrowPubKey
    );

    // Create transfer instruction
    const transaction = new Transaction().add(
      createTransferCheckedInstruction(
        fromTokenAccount.address,
        mintPublicKey,
        toTokenAccount.address,
        ownerPubKey,
        amount * LAMPORTS_PER_SOL,
        9
      )
    );

    const signature = await this.connection.sendTransaction(transaction, [ownerKeypair]);
    return signature;
  }

  // Pay winner from escrow
  async payoutWinner(
    encryptedSecretKey: string,
    tokenMint: string,
    amount: number,
    winnerPublicKey: string
  ): Promise<string> {
    const secretKey = await EncryptionService.decrypt(encryptedSecretKey);
    const escrowKeypair = Keypair.fromSecretKey(Buffer.from(secretKey, 'base64'));

    const mintPublicKey = new PublicKey(tokenMint);
    const escrowPubKey = escrowKeypair.publicKey;
    const winnerPubKey = new PublicKey(winnerPublicKey);

    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      escrowKeypair,
      mintPublicKey,
      escrowPubKey
    );

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      escrowKeypair,
      mintPublicKey,
      winnerPubKey
    );

    const transaction = new Transaction().add(
      createTransferCheckedInstruction(
        fromTokenAccount.address,
        mintPublicKey,
        toTokenAccount.address,
        escrowPubKey,
        amount * LAMPORTS_PER_SOL,
        9
      )
    );

    const signature = await this.connection.sendTransaction(transaction, [escrowKeypair]);
    return signature;
  }

  // Refund creator from escrow
  async refundCreator(
    encryptedSecretKey: string,
    tokenMint: string,
    amount: number,
    creatorPublicKey: string
  ): Promise<string> {
    return this.payoutWinner(encryptedSecretKey, tokenMint, amount, creatorPublicKey);
  }

  // Check escrow balance
  async getEscrowBalance(
    encryptedSecretKey: string,
    tokenMint: string
  ): Promise<number> {
    const secretKey = await EncryptionService.decrypt(encryptedSecretKey);
    const escrowKeypair = Keypair.fromSecretKey(Buffer.from(secretKey, 'base64'));

    const mintPublicKey = new PublicKey(tokenMint);
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      escrowKeypair,
      mintPublicKey,
      escrowKeypair.publicKey
    );

    const balance = await this.connection.getTokenAccountBalance(tokenAccount.address);
    return balance.value.uiAmount || 0;
  }
}
