import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Bool "mo:base/Bool";
import Nat64 "mo:base/Nat64";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Array "mo:base/Array";
import Debug "mo:base/Debug";

actor VyralBackend {
  // ─ Types ────────────────────────────────────────────────────────────────────
  public type Principal = Principal.Principal;
  
  public type UserProfile = {
    principal: Principal;
    username: ?Text;
    email: ?Text;
    icpBalance: Nat64; // Balance in e8s (smallest ICP unit)
    totalUnfollows: Nat;
    totalEarnings: Nat64; // Total ICP earned from operations
    linkedAt: Int;
    lastActive: Int;
    tikTokHandle: ?Text;
  };

  public type UnfollowSession = {
    id: Text;
    principal: Principal;
    startedAt: Int;
    endedAt: ?Int;
    unfollowCount: Nat;
    costPerUnfollow: Nat64; // in e8s
    totalCost: Nat64; // in e8s
    status: Text; // "active", "completed", "failed"
  };

  public type RegisterRequest = {
    tikTokHandle: Text;
    email: Text;
  };

  public type DepositRequest = {
    amount: Nat64; // in e8s
  };

  public type UnfollowRequest = {
    count: Nat;
    costPerUnfollow: Nat64;
  };

  // ─ State ────────────────────────────────────────────────────────────────────
  private var users = HashMap.HashMap<Principal, UserProfile>(0, Principal.equal, Principal.hash);
  private var sessions = HashMap.HashMap<Text, UnfollowSession>(0, Text.equal, Text.hash);
  private var sessionCounter: Nat = 0;

  // Followers, videos and hashtag tracking
  public type Follower = {
    id: Text; // follower handle or id
    displayName: ?Text;
    profileBio: ?Text;
    followerCount: Nat64;
    followingCount: Nat64;
    verified: Bool;
    accountType: ?Text;
    location: ?Text;
    language: ?Text;
    joinDate: ?Int;
    mutual: Bool; // follows you back
    engagementWithYou: Nat64; // aggregate likes/comments/shares on your content
    lastActive: Int;
    topInterests: Array.Array<Text>;
    topVideos: Array.Array<Text>;
    createdAt: Int;
    updatedAt: Int;
    riskFlags: Array.Array<Text>;
  };

  public type VideoStats = {
    id: Text;
    owner: Principal;
    title: ?Text;
    hashtags: Array.Array<Text>;
    views: Nat64;
    likes: Nat64;
    comments: Nat64;
    shares: Nat64;
    avgWatchTimeMillis: Nat64;
    createdAt: Int;
    updatedAt: Int;
  };

  public type HashtagStats = {
    tag: Text;
    usageCount: Nat;
    totalViews: Nat64;
    topVideos: Array.Array<Text>;
    updatedAt: Int;
  };

  // owner -> (followerId -> Follower)
  private var ownerFollowers = HashMap.HashMap<Principal, HashMap.HashMap<Text, Follower>>(0, Principal.equal, Principal.hash);
  // owner -> (videoId -> VideoStats)
  private var ownerVideos = HashMap.HashMap<Principal, HashMap.HashMap<Text, VideoStats>>(0, Principal.equal, Principal.hash);
  // global video map id -> VideoStats
  private var videos = HashMap.HashMap<Text, VideoStats>(0, Text.equal, Text.hash);
  // hashtag -> stats
  private var hashtags = HashMap.HashMap<Text, HashtagStats>(0, Text.equal, Text.hash);

  private let COST_PER_UNFOLLOW: Nat64 = 10_000; // 0.0001 ICP

  // ─ Public Methods ────────────────────────────────────────────────────────────
  
  /// Register a new user with TikTok handle
  public shared ({ caller }) func registerUser(req: RegisterRequest): async { ok: Bool; message: Text } {
    if (Principal.isAnonymous(caller)) {
      return { ok = false; message = "Must be authenticated"; };
    };

    let now = Time.now();
    
    let newUser: UserProfile = {
      principal = caller;
      username = ?req.tikTokHandle;
      email = ?req.email;
      icpBalance = 0;
      totalUnfollows = 0;
      totalEarnings = 0;
      linkedAt = now;
      lastActive = now;
      tikTokHandle = ?req.tikTokHandle;
    };

    users.put(caller, newUser);
    
    return { ok = true; message = "User registered successfully"; };
  };

  /// Get user profile
  public query ({ caller }) func getUserProfile(): async { ok: Bool; profile: ?UserProfile; message: Text } {
    if (Principal.isAnonymous(caller)) {
      return { ok = false; profile = null; message = "Must be authenticated"; };
    };

    switch (users.get(caller)) {
      case (null) {
        return { ok = false; profile = null; message = "User not found"; };
      };
      case (?profile) {
        return { ok = true; profile = ?profile; message = ""; };
      };
    };
  };

  /// Deposit ICP (simulated - in production this would verify ledger transfer)
  public shared ({ caller }) func depositICP(req: DepositRequest): async { ok: Bool; newBalance: Nat64; message: Text } {
    if (Principal.isAnonymous(caller)) {
      return { ok = false; newBalance = 0; message = "Must be authenticated"; };
    };

    switch (users.get(caller)) {
      case (null) {
        return { ok = false; newBalance = 0; message = "User not registered"; };
      };
      case (?profile) {
        let updatedProfile = {
          principal = profile.principal;
          username = profile.username;
          email = profile.email;
          icpBalance = profile.icpBalance + req.amount;
          totalUnfollows = profile.totalUnfollows;
          totalEarnings = profile.totalEarnings;
          linkedAt = profile.linkedAt;
          lastActive = Time.now();
          tikTokHandle = profile.tikTokHandle;
        };
        users.put(caller, updatedProfile);
        
        return {
          ok = true;
          newBalance = updatedProfile.icpBalance;
          message = "Deposit successful";
        };
      };
    };
  };

  /// Start an unfollow session
  public shared ({ caller }) func startUnfollowSession(req: UnfollowRequest): async { ok: Bool; sessionId: ?Text; message: Text } {
    if (Principal.isAnonymous(caller)) {
      return { ok = false; sessionId = null; message = "Must be authenticated"; };
    };

    switch (users.get(caller)) {
      case (null) {
        return { ok = false; sessionId = null; message = "User not registered"; };
      };
      case (?profile) {
        let totalCost = Nat64.fromNat(req.count) * req.costPerUnfollow;
        
        if (profile.icpBalance < totalCost) {
          return { ok = false; sessionId = null; message = "Insufficient balance"; };
        };

        let sessionId = "session_" # Nat.toText(sessionCounter);
        sessionCounter += 1;

        let session: UnfollowSession = {
          id = sessionId;
          principal = caller;
          startedAt = Time.now();
          endedAt = null;
          unfollowCount = 0;
          costPerUnfollow = req.costPerUnfollow;
          totalCost = totalCost;
          status = "active";
        };

        sessions.put(sessionId, session);

        // Deduct from balance (reserve the amount)
        let updatedProfile = {
          principal = profile.principal;
          username = profile.username;
          email = profile.email;
          icpBalance = profile.icpBalance - totalCost;
          totalUnfollows = profile.totalUnfollows;
          totalEarnings = profile.totalEarnings;
          linkedAt = profile.linkedAt;
          lastActive = Time.now();
          tikTokHandle = profile.tikTokHandle;
        };
        users.put(caller, updatedProfile);

        return { ok = true; sessionId = ?sessionId; message = "Session started"; };
      };
    };
  };

  /// Complete an unfollow session
  public shared ({ caller }) func completeUnfollowSession(sessionId: Text, successCount: Nat): async { ok: Bool; message: Text } {
    if (Principal.isAnonymous(caller)) {
      return { ok = false; message = "Must be authenticated"; };
    };

    switch (sessions.get(sessionId)) {
      case (null) {
        return { ok = false; message = "Session not found"; };
      };
      case (?session) {
        if (not Principal.equal(session.principal, caller)) {
          return { ok = false; message = "Unauthorized"; };
        };

        // Refund unused amount if not all unfollows were completed
        let refundAmount = Nat64.fromNat(session.unfollowCount - successCount) * session.costPerUnfollow;

        switch (users.get(caller)) {
          case (null) {
            return { ok = false; message = "User not found"; };
          };
          case (?profile) {
            let updatedProfile = {
              principal = profile.principal;
              username = profile.username;
              email = profile.email;
              icpBalance = profile.icpBalance + refundAmount;
              totalUnfollows = profile.totalUnfollows + successCount;
              totalEarnings = profile.totalEarnings + (Nat64.fromNat(successCount) * session.costPerUnfollow);
              linkedAt = profile.linkedAt;
              lastActive = Time.now();
              tikTokHandle = profile.tikTokHandle;
            };
            users.put(caller, updatedProfile);

            let updatedSession = {
              id = session.id;
              principal = session.principal;
              startedAt = session.startedAt;
              endedAt = ?Time.now();
              unfollowCount = successCount;
              costPerUnfollow = session.costPerUnfollow;
              totalCost = session.totalCost;
              status = "completed";
            };
            sessions.put(sessionId, updatedSession);

            return { ok = true; message = "Session completed"; };
          };
        };
      };
    };
  };

  /// Get session details
  public query func getSession(sessionId: Text): async { ok: Bool; session: ?UnfollowSession; message: Text } {
    switch (sessions.get(sessionId)) {
      case (null) {
        return { ok = false; session = null; message = "Session not found"; };
      };
      case (?session) {
        return { ok = true; session = ?session; message = ""; };
      };
    };
  };

  /// Update user's TikTok activity
  public shared ({ caller }) func updateActivity(): async { ok: Bool } {
    switch (users.get(caller)) {
      case (null) {
        return { ok = false };
      };
      case (?profile) {
        let updatedProfile = {
          principal = profile.principal;
          username = profile.username;
          email = profile.email;
          icpBalance = profile.icpBalance;
          totalUnfollows = profile.totalUnfollows;
          totalEarnings = profile.totalEarnings;
          linkedAt = profile.linkedAt;
          lastActive = Time.now();
          tikTokHandle = profile.tikTokHandle;
        };
        users.put(caller, updatedProfile);
        return { ok = true };
      };
    };
  };

  /// Get stats for debugging/admin
  public query func getStats(): async {
    totalUsers: Nat;
    activeSessions: Nat;
    totalUnfollows: Nat;
  } {
    let userCount = users.size();
    let sessionCount = sessions.size();
    var totalUnfollowsCount = 0;

    for (user in users.vals()) {
      totalUnfollowsCount += user.totalUnfollows;
    };

    return {
      totalUsers = userCount;
      activeSessions = sessionCount;
      totalUnfollows = totalUnfollowsCount;
    };
  };

  /* Followers & Content APIs */

  // Add or update a follower record for the calling user
  public shared ({ caller }) func addOrUpdateFollower(f: Follower): async { ok: Bool; message: Text } {
    if (Principal.isAnonymous(caller)) {
      return { ok = false; message = "Must be authenticated" }; 
    };

    var inner = switch (ownerFollowers.get(caller)) {
      case (null) { HashMap.HashMap<Text, Follower>(0, Text.equal, Text.hash) } 
      case (?m) { m }
    };

    let now = Time.now();
    let updated = {
      id = f.id;
      displayName = f.displayName;
      profileBio = f.profileBio;
      followerCount = f.followerCount;
      followingCount = f.followingCount;
      verified = f.verified;
      accountType = f.accountType;
      location = f.location;
      language = f.language;
      joinDate = f.joinDate;
      mutual = f.mutual;
      engagementWithYou = f.engagementWithYou;
      lastActive = f.lastActive;
      topInterests = f.topInterests;
      topVideos = f.topVideos;
      createdAt = if (f.createdAt == 0) { now } else { f.createdAt };
      updatedAt = now;
      riskFlags = f.riskFlags;
    };

    inner.put(f.id, updated);
    ownerFollowers.put(caller, inner);

    return { ok = true; message = "Follower saved" };
  };

  // Get a follower record for the caller
  public query ({ caller }) func getFollower(followerId: Text): async { ok: Bool; follower: ?Follower; message: Text } {
    if (Principal.isAnonymous(caller)) {
      return { ok = false; follower = null; message = "Must be authenticated" };
    };

    switch (ownerFollowers.get(caller)) {
      case (null) { return { ok = true; follower = null; message = "No followers" }; };
      case (?m) {
        switch (m.get(followerId)) {
          case (null) { return { ok = false; follower = null; message = "Follower not found" }; };
          case (?f) { return { ok = true; follower = ?f; message = "" }; };
        };
      };
    };
  };

  // List all followers for the caller
  public query ({ caller }) func listFollowers(): async { ok: Bool; followers: Array.Array<Follower>; message: Text } {
    if (Principal.isAnonymous(caller)) {
      return { ok = false; followers = Array.Array<Follower>(0); message = "Must be authenticated" };
    };

    switch (ownerFollowers.get(caller)) {
      case (null) { return { ok = true; followers = Array.Array<Follower>(0); message = "" }; };
      case (?m) { return { ok = true; followers = m.vals(); message = "" }; };
    };
  };

  // Add or update a video and update hashtag stats
  public shared ({ caller }) func addOrUpdateVideo(v: VideoStats): async { ok: Bool; message: Text } {
    if (Principal.isAnonymous(caller)) {
      return { ok = false; message = "Must be authenticated" };
    };

    // ensure caller is owner
    if (not Principal.equal(caller, v.owner)) {
      return { ok = false; message = "Owner mismatch" };
    };

    let now = Time.now();
    let updated = {
      id = v.id;
      owner = v.owner;
      title = v.title;
      hashtags = v.hashtags;
      views = v.views;
      likes = v.likes;
      comments = v.comments;
      shares = v.shares;
      avgWatchTimeMillis = v.avgWatchTimeMillis;
      createdAt = if (v.createdAt == 0) { now } else { v.createdAt };
      updatedAt = now;
    };

    videos.put(v.id, updated);

    var inner = switch (ownerVideos.get(caller)) {
      case (null) { HashMap.HashMap<Text, VideoStats>(0, Text.equal, Text.hash) };
      case (?m) { m }
    };
    inner.put(v.id, updated);
    ownerVideos.put(caller, inner);

    // update hashtag stats
    for (tag in v.hashtags.vals()) {
      var h = switch (hashtags.get(tag)) {
        case (null) { { tag = tag; usageCount = 0; totalViews = 0; topVideos = Array.Array<Text>(0); updatedAt = now } };
        case (?hs) { hs }
      };
      h.usageCount += 1;
      h.totalViews += v.views;
      // add to topVideos if not present (simple append)
      h.topVideos = Array.append(h.topVideos, Array.fromIter([v.id]));
      h.updatedAt = now;
      hashtags.put(tag, h);
    };

    return { ok = true; message = "Video saved" };
  };

  // List videos for caller
  public query ({ caller }) func listVideos(): async { ok: Bool; videos: Array.Array<VideoStats>; message: Text } {
    if (Principal.isAnonymous(caller)) {
      return { ok = false; videos = Array.Array<VideoStats>(0); message = "Must be authenticated" };
    };

    switch (ownerVideos.get(caller)) {
      case (null) { return { ok = true; videos = Array.Array<VideoStats>(0); message = "" }; };
      case (?m) { return { ok = true; videos = m.vals(); message = "" }; };
    };
  };

  // Get hashtag stats
  public query func getHashtag(tag: Text): async { ok: Bool; stats: ?HashtagStats; message: Text } {
    switch (hashtags.get(tag)) {
      case (null) { return { ok = false; stats = null; message = "Hashtag not found" }; };
      case (?h) { return { ok = true; stats = ?h; message = "" }; };
    };
  };

  // Return top N followers sorted by followerCount for the caller
  public query ({ caller }) func topFollowers(limit: Nat): async { ok: Bool; followers: Array.Array<Follower>; message: Text } {
    if (Principal.isAnonymous(caller)) {
      return { ok = false; followers = Array.Array<Follower>(0); message = "Must be authenticated" };
    };

    switch (ownerFollowers.get(caller)) {
      case (null) { return { ok = true; followers = Array.Array<Follower>(0); message = "" }; };
      case (?m) {
        var arr = m.vals();
        // simple selection sort for descending followerCount
        let n = Array.size(arr);
        var i: Nat = 0;
        while (i < n) {
          var maxIdx: Nat = i;
          var j: Nat = i + 1;
          while (j < n) {
            if (arr[j].followerCount > arr[maxIdx].followerCount) {
              maxIdx := j;
            };
            j += 1;
          };
          // swap i and maxIdx
          if (maxIdx != i) {
            let tmp = arr[i];
            arr[i] := arr[maxIdx];
            arr[maxIdx] := tmp;
          };
          i += 1;
        };

        // truncate to limit
        let lim = if (limit == 0 or limit as Int >= Array.size(arr) as Int) { Array.size(arr) } else { limit };
        var out = Array.Array<Follower>(0);
        var k: Nat = 0;
        while (k < lim) {
          out := Array.append(out, Array.fromIter([arr[k]]));
          k += 1;
        };

        return { ok = true; followers = out; message = "" };
      };
    };
  };
}
