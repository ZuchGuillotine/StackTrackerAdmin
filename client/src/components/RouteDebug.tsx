
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RouteDebug() {
  const [location] = useLocation();
  // This is a generic params capture to see what we're getting
  const params = useParams();
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    // Log routing information on mount and location change
    console.log("Current location:", location);
    console.log("Route params:", params);
    
    // Parse URL parameters manually as a backup
    const urlParts = location.split('/');
    console.log("URL parts:", urlParts);
    
    // If we're on a route with an ID, log it specifically
    if (location.includes('/blog-editor/')) {
      const id = urlParts[urlParts.length - 1];
      console.log("Blog editor ID from URL:", id);
    }
  }, [location, params]);
  
  if (!visible) return null;
  
  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 opacity-90 hover:opacity-100 transition-opacity">
      <CardHeader className="py-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm">Route Debugger</CardTitle>
          <button 
            onClick={() => setVisible(false)}
            className="text-xs bg-gray-200 px-2 py-1 rounded"
          >
            Close
          </button>
        </div>
      </CardHeader>
      <CardContent className="py-2 text-xs">
        <p><strong>Current route:</strong> {location}</p>
        <p><strong>Params:</strong> {JSON.stringify(params)}</p>
        <div className="mt-2">
          <button
            onClick={() => {
              console.log("Manual route check");
              console.log("Current location:", location);
              
              // Parse URL parameters manually
              const urlParts = location.split('/');
              console.log("URL parts:", urlParts);
              
              // If we're on a route with an ID, try to fetch it directly
              if (location.includes('/blog-editor/')) {
                const id = urlParts[urlParts.length - 1];
                console.log("Blog editor ID from URL:", id);
                
                // Try a manual fetch
                fetch(`/api/blog/${id}`, { 
                  credentials: 'include',
                  cache: 'no-cache'
                })
                .then(res => {
                  console.log("Manual fetch response status:", res.status);
                  return res.json();
                })
                .then(data => {
                  console.log("Manual fetch response data:", data);
                })
                .catch(err => {
                  console.error("Manual fetch error:", err);
                });
              }
            }}
            className="bg-blue-500 text-white px-2 py-1 rounded"
          >
            Test Route
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
