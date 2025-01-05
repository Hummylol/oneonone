import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import backendlink from "../backendlink.js";

function ServerStatus() {
  const [isOnline, setIsOnline] = useState(null);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const res = await fetch(`${backendlink}/auth/status`);
        if (res.ok) {
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      } catch (error) {
        setIsOnline(false);
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  const cardClasses = `relative p-4 w-[350px] mx-auto flex flex-col gap-3 items-center justify-center text-white ${
    isOnline === null
      ? "bg-gray-500"
      : isOnline
      ? "bg-green-600"
      : "bg-red-600"
  }`;

  return (
    <Card className={cardClasses} >
      {isOnline === null ? (
        <div className="text-center">
          <p>Checking server status...</p>
        </div>
      ) : isOnline ? (
        <div className="flex items-center gap-3 text-white">
          <CheckCircle className="h-5 w-5 sm:h-8 sm:w-8 md:h-8 md:w-8" />
          <p className="text-sm sm:text-base md:text-lg">Server is online!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 items-center text-white">
          <div className="flex items-center gap-3">
            <AlertTriangle className="absolute bottom-2 right-2 h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
            <p className="text-sm sm:text-base md:text-lg">
              Server is offline. Please wait 1-2 minutes for it to come back online.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOnline(null)}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
            <span className="text-sm sm:text-base md:text-lg">Retry</span>
          </Button>
        </div>
      )}
    </Card>
  );
}

export default ServerStatus;
