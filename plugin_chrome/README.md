# TikTok Unfollow Non-Friends Chrome Extension

A Chrome extension that automatically unfollows TikTok users who don't follow you back, with built-in rate limiting to protect your account.

## Features

- ✅ Automatically loads your following and followers lists
- ✅ Identifies users who don't follow you back
- ✅ Unfollows non-friends with rate limiting (3-5 seconds between actions)
- ✅ Real-time progress tracking and logging
- ✅ Safe to use with built-in delays

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `tiktok_unfollow` folder
5. The extension icon should appear in your Chrome toolbar

## Usage

1. **Navigate to TikTok**: Open TikTok.com and make sure you're logged in
2. **Click the extension icon**: Click the TikTok Unfollower icon in your Chrome toolbar
3. **Click "Start Unfollowing"**: The extension will:
   - Load your following list
   - Load your followers list
   - Calculate who doesn't follow you back
   - Ask for confirmation before proceeding
   - Start unfollowing with rate limiting

## Important Notes

### Rate Limiting
- The extension waits 3-5 seconds (randomized) between each unfollow action
- This helps prevent TikTok from flagging your account for suspicious activity
- **DO NOT** modify the delays to be faster - this could get your account restricted

### Limitations
- The extension works by interacting with TikTok's UI, not their API
- You must stay on the TikTok tab while the extension is running
- Large following lists may take a significant amount of time
- TikTok's UI may change, which could break the extension

### Safety Tips
- Start with a small test run first
- Monitor the process to ensure it's working correctly
- Stop immediately if you notice any issues
- Consider unfollowing in batches rather than all at once
- Never leave the extension running unattended for long periods

## How It Works

1. **Data Collection**: The extension navigates to your Following and Followers pages and scrolls through the lists to collect all usernames
2. **Comparison**: It compares the two lists to identify users you follow who don't follow you back
3. **Unfollowing**: For each non-friend, it:
   - Navigates to their profile
   - Clicks the "Following" button
   - Confirms the unfollow action
   - Waits 3-5 seconds before the next action

## Troubleshooting

### Extension not working?
- Make sure you're logged into TikTok
- Refresh the TikTok page and try again
- Check that TikTok's UI hasn't changed (the extension relies on specific data attributes)

### Getting errors?
- Open Chrome DevTools (F12) and check the Console for errors
- The extension may need updates if TikTok changes their UI structure

### Process too slow?
- The rate limiting is intentional to protect your account
- Faster unfollowing could result in account restrictions

## Disclaimer

Use this extension at your own risk. TikTok's Terms of Service may restrict automated actions. This extension is provided for educational purposes only.

## License

MIT License - Feel free to modify and use as needed.
