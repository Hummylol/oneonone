import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

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

  return (
    <Card className="p-4 w-[300px] mx-auto flex flex-col gap-3 items-center justify-center">
      {isOnline === null ? (
        <div className="text-center">
          <p>Checking server status...</p>
        </div>
      ) : isOnline ? (
        <div className="flex items-center gap-2 text-success">
          <CheckCircle className="h-5 w-5" />
          <p>Server is online!</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <p>Server is offline. Please wait 1-2 minutes for the server to come back online.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOnline(null)} 
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}
    </Card>
  );
}

export default ServerStatus;
