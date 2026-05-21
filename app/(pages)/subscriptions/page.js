import SubscriptionsPageClient from "@/components/clients/SubscriptionsPageClient";
import { getCurrentUser } from "@/lib/auth";
import {
  getServerChannelInfo,
  getServerSubscriptions,
} from "@/lib/server/protected-data";
import { redirect } from "next/navigation";

export default async function SubscriptionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth?next=/subscriptions");
  }

  const subscriptions = await getServerSubscriptions();
  const channelData = await getServerChannelInfo(subscriptions);
  return (
    <SubscriptionsPageClient
      initialSubscriptions={subscriptions}
      initialChannelData={channelData}
    />
  );
}
