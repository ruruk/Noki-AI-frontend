"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NokiCard } from "@/components/global/noki-card";
import {
  User,
  Mail,
  Shield,
  GraduationCap,
  RefreshCw,
  Trash2,
  LogOut,
  Zap,
  TrendingUp,
  Crown,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  Edit2,
  Link,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { useAuthContext } from "@/services/auth/auth-context";
import { getUserService } from "@/services";
import { getCanvasService } from "@/services";
import { notificationService } from "@/services/notification/notification.service";
import { useCanvas } from "@/services/hooks/useCanvas";

interface UserProfile {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  profile_image?: string;
  google_id?: string;
}

interface CanvasProvider {
  id: string;
  base_url: string;
  metadata?: any;
  created_at: string;
  hasToken: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, fetchProfile } = useAuthContext();
  const { linkCanvasData, isLoading: canvasLoading } = useCanvas();
  const userService = getUserService();
  const canvasService = getCanvasService();

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});

  // Canvas state
  const [canvasProvider, setCanvasProvider] = useState<CanvasProvider | null>(
    null
  );
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [isEditingToken, setIsEditingToken] = useState(false);
  const [canvasToken, setCanvasToken] = useState("");
  const [canvasUrl, setCanvasUrl] = useState("");
  const [tempToken, setTempToken] = useState("");

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Account deletion state
  const [showAccountDeleteConfirm, setShowAccountDeleteConfirm] =
    useState(false);

  // AI Usage state
  const [aiUsage, setAiUsage] = useState<any>(null);
  const [isLoadingAIUsage, setIsLoadingAIUsage] = useState(true);

  // Load user profile
  useEffect(() => {
    loadProfile();
    loadCanvasProvider();
    loadAIUsage();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const response = await userService.getProfile();
      if (response.success && response.data) {
        setProfile(response.data as UserProfile);
        setEditedProfile(response.data);
      }
    } catch (error) {
      notificationService.error(
        "Failed to load profile",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadCanvasProvider = async () => {
    try {
      setIsLoadingCanvas(true);
      const response = await canvasService.getCanvasProvider();
      if (response.success && response.data && response.data.base_url) {
        setCanvasProvider(response.data);
        setCanvasUrl(response.data.base_url);
        // Token is not returned for security, but we know it exists
        setCanvasToken("••••••••••••••••••••••••••••••••");
      } else {
        setCanvasProvider(null);
      }
    } catch (error) {
      console.error("Failed to load Canvas provider:", error);
      setCanvasProvider(null);
    } finally {
      setIsLoadingCanvas(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditedProfile(profile || {});
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditedProfile(profile || {});
  };

  const handleSaveProfile = async () => {
    try {
      const response = await userService.updateProfile(editedProfile);
      if (response.success) {
        setProfile(response.data as UserProfile);
        setIsEditingProfile(false);
        await fetchProfile(); // Refresh auth context
        notificationService.success("Profile updated successfully");
      } else {
        notificationService.error("Failed to update profile", response.message);
      }
    } catch (error) {
      notificationService.error(
        "Failed to update profile",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const result = await linkCanvasData();
      if (result) {
        notificationService.success(
          "Canvas sync completed",
          result.message || "Your Canvas data has been synced successfully"
        );
        // Reload data
        await loadCanvasProvider();
      } else {
        notificationService.error("Canvas sync failed", "Please try again");
      }
    } catch (error) {
      notificationService.error(
        "Canvas sync failed",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteCanvasData = async () => {
    try {
      const response = await canvasService.deleteAllCanvasData();
      if (response.success) {
        setShowDeleteConfirm(false);
        setCanvasProvider(null);
        setCanvasUrl("");
        setCanvasToken("");
        notificationService.success(
          "Canvas data deleted",
          "All Canvas data has been removed"
        );
      } else {
        notificationService.error(
          "Failed to delete Canvas data",
          response.message
        );
      }
    } catch (error) {
      notificationService.error(
        "Failed to delete Canvas data",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  const handleSaveToken = async () => {
    if (!tempToken || !canvasUrl) {
      notificationService.error(
        "Invalid input",
        "Please provide both URL and token"
      );
      return;
    }

    try {
      const response = await canvasService.setupCanvas({
        canvas_institutional_url: canvasUrl,
        canvas_token: tempToken,
      });

      if (response.success) {
        setCanvasToken(tempToken);
        setIsEditingToken(false);
        await loadCanvasProvider();
        notificationService.success(
          "Canvas token updated",
          "Your Canvas integration has been updated"
        );
      } else {
        notificationService.error("Failed to update token", response.message);
      }
    } catch (error) {
      notificationService.error(
        "Failed to update token",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      notificationService.error(
        "Password mismatch",
        "New passwords do not match"
      );
      return;
    }

    if (passwordData.newPassword.length < 6) {
      notificationService.error(
        "Invalid password",
        "Password must be at least 6 characters"
      );
      return;
    }

    try {
      const response = await userService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (response.success) {
        setShowPasswordChange(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        notificationService.success(
          "Password changed",
          "Your password has been updated successfully"
        );
      } else {
        notificationService.error(
          "Failed to change password",
          response.message
        );
      }
    } catch (error) {
      notificationService.error(
        "Failed to change password",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await userService.deleteAccount();
      if (response.success) {
        notificationService.success(
          "Account deleted",
          "Your account has been permanently deleted"
        );
        await logout();
        router.push("/signin");
      } else {
        notificationService.error("Failed to delete account", response.message);
      }
    } catch (error) {
      notificationService.error(
        "Failed to delete account",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/signin");
  };

  const loadAIUsage = async () => {
    try {
      setIsLoadingAIUsage(true);
      const response = await userService.getAIUsage();
      if (response.success && response.data) {
        setAiUsage(response.data);
      }
    } catch (error) {
      console.error("Failed to load AI usage:", error);
      // Don't show error notification, just set to null
      setAiUsage(null);
    } finally {
      setIsLoadingAIUsage(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-noki-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-poppins font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and preferences
        </p>
      </div>

      {/* Personal Information */}
      <NokiCard>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-noki-primary/10 rounded-xl flex items-center justify-center">
              <User className="text-noki-primary" size={20} />
            </div>
            <div className="text-xl font-poppins font-semibold text-foreground">
              Personal Information
            </div>
          </div>

          {isEditingProfile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editedProfile.firstname || ""}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        firstname: e.target.value,
                      })
                    }
                    className="w-full bg-background border border-border p-3 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-noki-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editedProfile.lastname || ""}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        lastname: e.target.value,
                      })
                    }
                    className="w-full bg-background border border-border p-3 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-noki-primary"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Email Address
                  </label>
                  <div className="bg-secondary p-3 rounded-lg flex items-center gap-2">
                    <Mail size={16} className="text-muted-foreground" />
                    <p className="text-foreground font-medium">
                      {profile?.email}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 bg-noki-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-noki-primary/90 transition-colors"
                >
                  <Save size={16} />
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 bg-secondary text-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </label>
                  <div className="bg-secondary p-3 rounded-lg">
                    <p className="text-foreground font-medium">
                      {profile?.firstname} {profile?.lastname}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Email Address
                  </label>
                  <div className="bg-secondary p-3 rounded-lg flex items-center gap-2">
                    <Mail size={16} className="text-muted-foreground" />
                    <p className="text-foreground font-medium">
                      {profile?.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Account Type
                  </label>
                  <div className="bg-secondary p-3 rounded-lg flex items-center gap-2">
                    <Shield size={16} className="text-muted-foreground" />
                    <p className="text-foreground font-medium">
                      {profile?.google_id ? "Google Account" : "Email Account"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleEditProfile}
                  className="w-full md:w-auto bg-noki-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-noki-primary/90 transition-colors"
                >
                  Edit Profile
                </button>
                {!profile?.google_id && (
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="w-full md:w-auto bg-secondary text-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-muted transition-colors"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {showPasswordChange && (
                <div className="bg-secondary p-4 rounded-lg space-y-4 border border-border">
                  <h3 className="font-medium text-foreground">
                    Change Password
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full bg-background border border-border p-3 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-noki-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full bg-background border border-border p-3 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-noki-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full bg-background border border-border p-3 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-noki-primary"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleChangePassword}
                        className="bg-noki-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-noki-primary/90 transition-colors text-sm"
                      >
                        Save Password
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                        className="bg-secondary text-foreground px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </NokiCard>

      {/* Canvas LMS Integration */}
      <NokiCard>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
              <GraduationCap className="text-red-500" size={20} />
            </div>
            <div className="text-xl font-poppins font-semibold text-foreground">
              Canvas LMS Integration
            </div>
          </div>

          {isLoadingCanvas ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-noki-primary" size={24} />
            </div>
          ) : canvasProvider ? (
            <div className="bg-secondary p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-green-500" size={20} />
                  <div>
                    <p className="font-medium text-foreground">Connected</p>
                    <p className="text-sm text-muted-foreground">
                      Your Canvas account is linked
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Link size={14} />
                    Institution URL
                  </label>
                  <div className="bg-background p-3 rounded-lg">
                    <p className="text-foreground font-mono text-sm">
                      {canvasUrl}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Shield size={14} />
                    Canvas API Token
                  </label>
                  {!isEditingToken ? (
                    <div className="bg-background p-3 rounded-lg flex items-center justify-between gap-3">
                      <p className="text-foreground font-mono text-sm flex-1 overflow-hidden">
                        {showToken
                          ? canvasToken
                          : "••••••••••••••••••••••••••••••••"}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowToken(!showToken)}
                          className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                          title={showToken ? "Hide token" : "Show token"}
                        >
                          {showToken ? (
                            <EyeOff
                              size={16}
                              className="text-muted-foreground"
                            />
                          ) : (
                            <Eye size={16} className="text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingToken(true);
                            setTempToken("");
                          }}
                          className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                          title="Edit token"
                        >
                          <Edit2 size={16} className="text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={tempToken}
                        onChange={(e) => setTempToken(e.target.value)}
                        className="w-full bg-background border border-border p-3 rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-noki-primary"
                        placeholder="Enter your Canvas API token"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveToken}
                          className="bg-noki-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-noki-primary/90 transition-colors text-sm"
                        >
                          Save Token
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingToken(false);
                            setTempToken("");
                          }}
                          className="bg-secondary text-foreground px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar size={16} />
                  <span>
                    Connected on:{" "}
                    {new Date(canvasProvider.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleSync}
                    disabled={isSyncing || canvasLoading}
                    className="flex items-center gap-2 bg-noki-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-noki-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw
                      size={16}
                      className={isSyncing ? "animate-spin" : ""}
                    />
                    {isSyncing ? "Syncing..." : "Sync Now"}
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-lg font-medium hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={16} />
                    Delete Canvas Data
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-secondary p-4 rounded-lg">
              <p className="text-muted-foreground mb-4">
                Connect your Canvas LMS account to sync courses and assignments.
              </p>
              <button
                onClick={() => router.push("/getting-started")}
                className="bg-noki-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-noki-primary/90 transition-colors"
              >
                Setup Canvas Integration
              </button>
            </div>
          )}

          {/* Delete Canvas Data Confirmation */}
          {showDeleteConfirm && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="text-red-500 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <div className="space-y-2 flex-1">
                  <p className="font-medium text-foreground">Are you sure?</p>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete all your Canvas courses,
                    assignments, and related data. This action cannot be undone.
                  </p>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleDeleteCanvasData}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
                    >
                      Yes, Delete Data
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="bg-secondary text-foreground px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </NokiCard>

      {/* AI Usage & Tokens */}
      <NokiCard>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-noki-tertiary/10 rounded-xl flex items-center justify-center">
              <Zap className="text-noki-tertiary" size={20} />
            </div>
            <div className="text-xl font-poppins font-semibold text-foreground">
              AI Usage
            </div>
          </div>

          {isLoadingAIUsage ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-noki-primary" size={24} />
            </div>
          ) : aiUsage ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-noki-primary/10 to-noki-tertiary/10 p-6 rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      AI Tokens Remaining
                    </p>
                    <Zap className="text-noki-primary" size={18} />
                  </div>
                  <p className="text-3xl font-poppins font-bold text-foreground">
                    {aiUsage.limits.tokens_remaining.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {aiUsage.limits.token_limit.toLocaleString()} tokens
                  </p>
                  <div className="w-full bg-secondary rounded-full h-2 mt-3">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        aiUsage.limits.usage_percentage >= 90
                          ? "bg-red-500"
                          : aiUsage.limits.usage_percentage >= 70
                          ? "bg-yellow-500"
                          : "bg-noki-primary"
                      }`}
                      style={{
                        width: `${Math.min(
                          aiUsage.limits.usage_percentage,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-noki-tertiary/10 to-purple-500/10 p-6 rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      This Month's Usage
                    </p>
                    <TrendingUp className="text-noki-tertiary" size={18} />
                  </div>
                  <p className="text-3xl font-poppins font-bold text-foreground">
                    {aiUsage.monthly.total_tokens.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    tokens used
                  </p>
                  {aiUsage.monthly.change_percentage !== 0 && (
                    <p
                      className={`text-xs mt-2 ${
                        aiUsage.monthly.change_percentage > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {aiUsage.monthly.change_percentage > 0 ? "↑" : "↓"}{" "}
                      {Math.abs(aiUsage.monthly.change_percentage).toFixed(1)}%
                      from last month
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-secondary p-4 rounded-lg space-y-3">
                <h3 className="font-medium text-foreground">Usage Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total tokens (all time)
                    </span>
                    <span className="text-foreground font-medium">
                      {aiUsage.totals.total_tokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total conversations
                    </span>
                    <span className="text-foreground font-medium">
                      {aiUsage.message_count}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Monthly cost (estimated)
                    </span>
                    <span className="text-foreground font-medium">
                      ${aiUsage.monthly.cost_usd.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total cost (estimated)
                    </span>
                    <span className="text-foreground font-medium">
                      ${aiUsage.totals.total_cost_usd.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              {aiUsage.limits.usage_percentage >= 80 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className="text-yellow-500 flex-shrink-0 mt-0.5"
                      size={20}
                    />
                    <div>
                      <p className="font-medium text-foreground">
                        Approaching Token Limit
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        You've used {aiUsage.limits.usage_percentage.toFixed(1)}
                        % of your monthly token limit. Consider upgrading to
                        Premium for unlimited tokens.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-secondary p-4 rounded-lg">
              <p className="text-muted-foreground text-sm">
                No AI usage data available yet. Start chatting with Noki AI to
                see your statistics here.
              </p>
            </div>
          )}
        </div>
      </NokiCard>

      {/* Upgrade Account */}
      <NokiCard className="bg-gradient-to-br from-noki-primary/5 to-noki-tertiary/5 border-2 border-noki-primary/20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-noki-primary to-noki-tertiary rounded-xl flex items-center justify-center">
              <Crown className="text-white" size={20} />
            </div>
            <div className="text-xl font-poppins font-semibold text-foreground">
              Upgrade to Premium
            </div>
          </div>

          <p className="text-muted-foreground">
            Unlock unlimited AI tokens, advanced features, priority support, and
            more with Noki Premium.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2
                className="text-noki-primary flex-shrink-0"
                size={20}
              />
              <span className="text-sm text-foreground">
                Unlimited AI tokens
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2
                className="text-noki-primary flex-shrink-0"
                size={20}
              />
              <span className="text-sm text-foreground">Priority support</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2
                className="text-noki-primary flex-shrink-0"
                size={20}
              />
              <span className="text-sm text-foreground">
                Advanced analytics
              </span>
            </div>
          </div>

          <button className="w-full md:w-auto bg-gradient-to-r from-noki-primary to-noki-tertiary text-white px-8 py-3 rounded-lg font-poppins font-semibold hover:shadow-lg transition-all">
            Upgrade Now
          </button>
        </div>
      </NokiCard>

      {/* Account Actions */}
      <NokiCard>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
              <Shield className="text-orange-500" size={20} />
            </div>
            <div className="text-xl font-poppins font-semibold text-foreground">
              Account Actions
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 bg-secondary hover:bg-muted rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <LogOut
                  className="text-muted-foreground group-hover:text-foreground transition-colors"
                  size={20}
                />
                <div className="text-left">
                  <p className="font-medium text-foreground">Logout</p>
                  <p className="text-sm text-muted-foreground">
                    Sign out of your account
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowAccountDeleteConfirm(true)}
              className="w-full flex items-center justify-between p-4 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors group border border-red-500/20"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="text-red-500" size={20} />
                <div className="text-left">
                  <p className="font-medium text-red-500">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Delete Account Confirmation */}
          {showAccountDeleteConfirm && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="text-red-500 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <div className="space-y-2 flex-1">
                  <p className="font-medium text-foreground">
                    Delete Your Account?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete your account, all your
                    projects, tasks, todos, and Canvas data. This action cannot
                    be undone and you will lose access immediately.
                  </p>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleDeleteAccount}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
                    >
                      Yes, Delete My Account
                    </button>
                    <button
                      onClick={() => setShowAccountDeleteConfirm(false)}
                      className="bg-secondary text-foreground px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </NokiCard>
    </div>
  );
}
