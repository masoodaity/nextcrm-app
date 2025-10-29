"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog-document-view";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export default function ModalDocumentView({
  isOpen,
  onClose,
  children,
}: ModalProps) {
  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onChange}>
      <DialogContent className="w-full h-4/5">
        <DialogHeader>
          <DialogTitle>Document Preview</DialogTitle>
        </DialogHeader>
        <div className="h-full py-10">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
