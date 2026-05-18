"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="hidden md:inline-flex no-print"
      onClick={() => {
        if (typeof window !== "undefined") window.print();
      }}
    >
      <Printer size={14} /> 인쇄
    </Button>
  );
}
