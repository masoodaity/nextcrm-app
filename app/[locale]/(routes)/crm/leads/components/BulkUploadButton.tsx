"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import BulkUploadModal from "./BulkUploadModal";

export default function BulkUploadButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} className="gap-2">
        <Upload className="h-4 w-4" />
        Bulk Upload Leads
      </Button>
      
      <BulkUploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
