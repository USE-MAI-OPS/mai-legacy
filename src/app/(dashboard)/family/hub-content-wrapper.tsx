"use client";

import { type ReactNode } from "react";
import { HubSwipeWrapper } from "@/components/hub-swipe-wrapper";

export function HubContentWrapper({ children }: { children: ReactNode }) {
  return <HubSwipeWrapper>{children}</HubSwipeWrapper>;
}
