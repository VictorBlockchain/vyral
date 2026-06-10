# Vyral.buzz - Web3 Viral Challenges Marketplace

A decentralized viral challenges marketplace built on Solana, where users can create, participate in, and win viral challenges with VYRAL token rewards.

## 🌟 Features

### Viral Challenges Marketplace
- **Create Challenges**: Post viral challenges with VYRAL token rewards
- **Submit Entries**: Accept challenges and submit video proof (YouTube, TikTok, etc.)
- **Vote & Win**: Community votes on submissions using VYRAL tokens
- **Escrow System**: Each challenge has a dedicated Solana escrow wallet for secure reward holding

### Chrome Plugin Tool
- **TikTok Unfollow Manager**: Clean up non-followers to boost account visibility
- **Account Safety**: Human-like behavior patterns to keep your account safe
- **Pay-as-you-go**: Use VYRAL tokens to access the unfollow tool

### Web3 Integration
- **Solana Wallet Support**: Connect Phantom, Solflare, or Backpack wallets
- **VYRAL Token**: SPL token for marketplace transactions
- **Escrow Management**: Automated payout and refund system
- **Secure Key Storage**: AES-256-GCM encryption for escrow private keys

### Admin Dashboard
- **Challenge Management**: View, edit, close challenges
- **User Management**: Search users, grant admin privileges
- **Payout Processing**: One-click payout to winners
- **Refund Processing**: Return funds to challenge creators
- **Platform Analytics**: Real-time statistics and metrics

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Radix UI
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **Blockchain**: Solana (@solana/web3.js, @solana/spl-token)
- **Wallet**: Solana Wallet Adapter (Phantom, Solflare, Backpack)
- **Authentication**: Wallet-based (no traditional login)
- **Encryption**: Node.js crypto (AES-256-GCM)

## 📋 Prerequisites

- Node.js 18+ or Bun
- Supabase account (free tier works)
- Solana wallet (Phantom, Solflare, or Backpack)
- VYRAL token mint address (or use devnet tokens)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/VictorBlockchain/vyral.git
cd vyral
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# VYRAL Token Configuration
NEXT_PUBLIC_VYRAL_TOKEN_MINT_ADDRESS=YourTokenMintAddressHere

# Encryption (Generate a secure 256-bit key)
# You can generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-secure-256-bit-encryption-key-here

# Admin Setup (initial admin wallet address)
INITIAL_ADMIN_WALLET=your-solana-wallet-address-here
```

### 4. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate
```

### 5. Create Admin User

```bash
# Install tsx if not already installed
npm install -D tsx

# Run the seed script
npx tsx scripts/seed-admin.ts
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 How It Works

### For Challenge Creators

1. **Connect Wallet**: Connect your Solana wallet
2. **Create Challenge**: Fill in challenge details and set VYRAL reward amount
3. **Fund Escrow**: Transfer VYRAL tokens to the challenge's escrow wallet
4. **Wait for Submissions**: Users submit their entries
5. **Select Winner**: Admin or community votes determine the winner
6. **Automatic Payout**: Winner receives VYRAL tokens from escrow

### For Challenge Participants

1. **Connect Wallet**: No VYRAL tokens required to participate
2. **Browse Challenges**: Find active challenges that interest you
3. **Accept & Submit**: Submit your video entry (YouTube, TikTok, etc.)
4. **Get Voted**: Community votes on submissions
5. **Win Rewards**: Best submission wins the VYRAL token reward

### For Admins

1. **Access Dashboard**: Connect admin wallet and click "Admin" in header
2. **Manage Challenges**: View all challenges, filter by status
3. **Process Payouts**: One-click payout to winners
4. **Process Refunds**: Return funds to creators if needed
5. **Manage Users**: Search users, grant/revoke admin privileges

## 🏗️ Project Structure

```
vyral/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── challenges/        # Challenges marketplace pages
│   │   ├── api/               # API routes
│   │   │   ├── admin/         # Admin API endpoints
│   │   │   ├── challenges/    # Challenges API
│   │   │   ├── submissions/   # Submissions API
│   │   │   └── user/          # User API
│   │   └── page.tsx           # Homepage
│   ├── components/            # React components
│   │   ├── admin/             # Admin UI components
│   │   └── ui/                # Reusable UI components
│   ├── context/               # React contexts
│   │   ├── WalletContext.tsx  # Solana wallet provider
│   │   ├── UserContext.tsx    # User authentication
│   │   └── AdminContext.tsx   # Admin authorization
│   ├── hooks/                 # Custom React hooks
│   └── lib/                   # Utility libraries
│       ├── encryption.ts      # AES-256-GCM encryption
│       ├── escrow.ts          # Solana escrow service
│       ├── admin-auth.ts      # Admin verification
│       └── supabase.ts        # Supabase client
├── prisma/
│   └── schema.prisma          # Database schema
├── scripts/
│   └── seed-admin.ts          # Admin user seed script
└── public/                    # Static assets
```

## 🔒 Security Features

- **Encrypted Private Keys**: All escrow private keys encrypted with AES-256-GCM
- **Wallet-Based Auth**: No passwords, secure Solana wallet authentication
- **Admin Verification**: All admin routes require wallet-based verification
- **Transaction Logging**: Complete audit trail of all payouts and refunds
- **Environment Protection**: Sensitive data stored in .env only

## 📊 Database Schema

### Core Models

- **User**: Wallet address, username, VYRAL balance, admin status
- **Challenge**: Title, description, reward, escrow wallet, status, winner
- **Submission**: Video URL, description, vote count, status
- **Vote**: User votes on submissions (one vote per user per submission)
- **Admin**: Admin roles and permissions
- **Transaction**: Escrow deposits, payouts, and refunds

## 🎨 UI Components

- **ChallengeCard**: Displays challenge info with reward and deadline
- **SubmissionCard**: Video submission with voting functionality
- **CountdownTimer**: Real-time countdown to challenge end
- **TokenBalance**: Displays user's VYRAL token balance
- **WalletConnectButton**: Solana wallet connection UI
- **AdminSidebar**: Admin navigation menu
- **AdminGuard**: Route protection for admin pages

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Environment Variables for Production

Make sure to set all environment variables in Vercel dashboard:
- All Supabase credentials
- Production Solana RPC URL
- Production VYRAL token mint address
- Secure encryption key
- Admin wallet address

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema to database
npm run db:reset     # Reset database
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🌐 Links

- **Website**: [vyral.buzz](https://vyral.buzz)
- **GitHub**: [github.com/VictorBlockchain/vyral](https://github.com/VictorBlockchain/vyral)
- **Solana**: [solana.com](https://solana.com)
- **Supabase**: [supabase.com](https://supabase.com)

## 💡 Future Enhancements

- [ ] Video upload to Supabase Storage or IPFS
- [ ] Email notifications for winners and creators
- [ ] Challenge categories and tags
- [ ] Advanced search and filtering
- [ ] User reputation system
- [ ] Multi-signature escrow for large payouts
- [ ] Automated payout on challenge end
- [ ] Mobile app (React Native)
- [ ] More wallet providers
- [ ] Challenge templates
- [ ] Analytics dashboard with charts

## 🆘 Support

If you have any questions or need help:

1. Check the documentation above
2. Open an issue on GitHub
3. Contact the development team

## 🙏 Acknowledgments

- Solana ecosystem for the amazing blockchain infrastructure
- Supabase for the excellent backend-as-a-service
- Next.js team for the incredible React framework
- All contributors and community members

---

Built with ❤️ by the Vyral Team
