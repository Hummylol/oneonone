import React from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, SearchIcon } from "lucide-react";
import Search from './Search';

function MobileSearchSheet({ open, onOpenChange, onSelectUser }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <SearchIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle></SheetTitle>
          <SheetDescription>
            Select a user to start chatting
          </SheetDescription>
        </SheetHeader>
        <div className="pt-6">
          <Search onSelectUser={onSelectUser} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MobileSearchSheet; 