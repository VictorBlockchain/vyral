'use client';

import { useState, useRef } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/Button';
import { useUser } from '@/context/UserContext';
import { useWalletContext } from '@/context/WalletContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

const supabaseUrl = process.env.NEXT_PUBLIC_vyral_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_vyral_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CreateChallengePage() {
  const { user, isAuthenticated } = useUser();
  const { publicKey, vyralBalance, refreshBalance } = useWalletContext();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Feature flag for VYRAL requirement
  const requireVyral = process.env.NEXT_PUBLIC_REQUIRE_VYRAL_TO_CREATE_CHALLENGE === 'true';
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rewardAmount: '',
    endDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to create a challenge",
        variant: "destructive",
      });
      return;
    }

    const rewardAmount = parseFloat(formData.rewardAmount);

    // Check if user has enough VYRAL tokens (if required)
    if (requireVyral && vyralBalance < 1) {
      toast({
        title: "Insufficient VYRAL Balance",
        description: `You need at least 1 VYRAL to create a challenge. Current balance: ${vyralBalance.toFixed(4)} VYRAL`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let imageUrl: string | null = null;

      // Upload image if provided
      if (imageFile) {
        setUploading(true);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `challenges/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast({
            title: "Upload Failed",
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          });
          setLoading(false);
          setUploading(false);
          return;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
        setUploading(false);
      }

      // Create challenge
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          rewardAmount,
          endDate: formData.endDate,
          creatorId: user.id,
          tokenMint: process.env.NEXT_PUBLIC_VYRAL_TOKEN_MINT_ADDRESS,
          thumbnailUrl: imageUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh balance after creating challenge
        await refreshBalance();
        
        toast({
          title: "Challenge Created!",
          description: "Your viral challenge is now live and accepting submissions.",
        });
        
        router.push(`/challenges/${data.challenge.id}`);
      } else {
        const error = await response.json();
        toast({
          title: "Creation Failed",
          description: error.error || "Failed to create challenge. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (PNG, JPG, GIF, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Image size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            background: 'white',
            border: '3px solid black',
            borderRadius: '12px',
            boxShadow: '4px 4px 0px black',
            maxWidth: '600px',
            margin: '40px auto',
          }}
        >
          <h2 style={{ fontSize: '2rem', marginBottom: '15px' }}>Wallet Required</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Please connect your Solana wallet to create a challenge.
          </p>
          <Link href="/challenges" style={{ textDecoration: 'none' }}>
            <Button>Back to Challenges</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="page-section">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '10px' }}>
            Create Challenge
          </h1>
          <p style={{ color: '#666', marginBottom: '40px' }}>
            Post a viral challenge and reward the best submissions with VYRAL tokens.
          </p>

          <div
            style={{
              background: 'white',
              border: '4px solid black',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '5px 5px 0px black',
            }}
          >
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Challenge Image (Optional)
                </label>
                <div
                  style={{
                    border: '2px dashed black',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: imagePreview ? '#f9f9f9' : 'white',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <div>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '300px',
                          borderRadius: '8px',
                          marginBottom: '10px',
                        }}
                      />
                      <p style={{ fontSize: '0.85rem', color: '#666' }}>
                        Click to change image
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📷</div>
                      <p style={{ fontWeight: 600, marginBottom: '5px' }}>
                        Click to upload an image
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#999' }}>
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Challenge Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Best TikTok Dance Challenge"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid black',
                    borderRadius: '8px',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the challenge rules, requirements, and judging criteria..."
                  required
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid black',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Reward Amount (SOL) *
                </label>
                <input
                  type="number"
                  value={formData.rewardAmount}
                  onChange={(e) => setFormData({ ...formData, rewardAmount: e.target.value })}
                  placeholder="0.5"
                  min="0.01"
                  step="0.01"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid black',
                    borderRadius: '8px',
                    fontSize: '1rem',
                  }}
                />
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>
                  💰 Reward paid in SOL from escrow wallet
                  {requireVyral && (
                    <>
                      <br />
                      Your VYRAL balance: {vyralBalance.toFixed(4)} VYRAL
                      {vyralBalance < 1 && (
                        <span style={{ color: 'red', marginLeft: '10px' }}>⚠️ Need at least 1 VYRAL</span>
                      )}
                    </>
                  )}
                  {!requireVyral && (
                    <span style={{ color: '#4CAF50', marginLeft: '10px' }}>✅ Testing mode: VYRAL not required</span>
                  )}
                </p>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  End Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid black',
                    borderRadius: '8px',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div
                style={{
                  background: '#f0f0f0',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '0.9rem',
                }}
              >
                <strong>Note:</strong> VYRAL tokens will be held in escrow until the challenge
                completes. The winner will receive the reward automatically.
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button 
                  type="submit" 
                  disabled={loading || uploading || (requireVyral && vyralBalance < 1)}
                >
                  {uploading ? 'Uploading Image...' : loading ? 'Creating Challenge...' : 'Create Challenge'}
                </Button>
                <Link href="/challenges" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" type="button">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
