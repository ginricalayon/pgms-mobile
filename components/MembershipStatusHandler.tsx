import React from "react";
import { MembershipStatusView } from "./MembershipStatusView";
import { router } from "expo-router";

interface MembershipStatusHandlerProps {
  membershipStatus: string;
  trainerInfo?: TrainerInfo;
  onRefresh?: () => void;
  refreshing?: boolean;
  darkMode?: boolean;
  children?: React.ReactNode;
}

export function MembershipStatusHandler({
  membershipStatus,
  trainerInfo,
  onRefresh,
  refreshing = false,
  darkMode,
  children,
}: MembershipStatusHandlerProps) {
  const handleRenewMembership = () => {
    router.push("/screens/renew/RateSelection" as any);
  };

  if (membershipStatus === "Freezed" && trainerInfo?.firstName) {
    return (
      <MembershipStatusView
        icon="snowflake"
        iconColor="#64B5F6"
        title="Membership Frozen"
        message="Your account is currently frozen. Please unfreeze your membership at the gym to reschedule your sessions with your Personal Trainer"
        onRefresh={onRefresh}
        refreshing={refreshing}
        darkMode={darkMode}
      />
    );
  }

  if (membershipStatus === "Cancelled") {
    return (
      <MembershipStatusView
        icon="times-circle"
        iconColor="#DC2626"
        title="Membership Cancelled"
        message="Your membership has been cancelled. Please renew your membership to continue."
        onRefresh={onRefresh}
        refreshing={refreshing}
        darkMode={darkMode}
      />
    );
  }

  if (membershipStatus === "Expired" && !trainerInfo?.firstName) {
    return (
      <MembershipStatusView
        icon="clock"
        iconColor="#DC2626"
        title="Membership Expired"
        message="Your membership has expired. Please renew your membership and avail a personal trainer."
        onRefresh={onRefresh}
        refreshing={refreshing}
        darkMode={darkMode}
      />
    );
  }

  if (membershipStatus === "Expired" && trainerInfo?.firstName) {
    return (
      <MembershipStatusView
        icon="clock"
        iconColor="#DC2626"
        title="Membership Expired"
        message="Your membership has expired. Please renew your membership to continue your sessions with your personal trainer."
        onRefresh={onRefresh}
        refreshing={refreshing}
        darkMode={darkMode}
      />
    );
  }

  if (membershipStatus === "Active" && !trainerInfo?.firstName) {
    return (
      <MembershipStatusView
        icon="user-circle"
        iconColor="#64B5F6"
        title="No Personal Trainer"
        message="Your membership does not have a personal trainer. Please avail a personal trainer"
        onRefresh={onRefresh}
        refreshing={refreshing}
        darkMode={darkMode}
      />
    );
  }

  return <>{children}</>;
}
