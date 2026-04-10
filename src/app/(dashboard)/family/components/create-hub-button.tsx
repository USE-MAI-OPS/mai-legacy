"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateHubDialog } from "@/components/create-hub-dialog";

export function CreateHubButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="border-white/30 text-white hover:bg-white/10 rounded-full font-serif bg-transparent"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-2 h-5 w-5" />
        Create Hub
      </Button>
      <CreateHubDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
