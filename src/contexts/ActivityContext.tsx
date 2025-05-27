import React, { createContext, useState, useContext, useEffect } from "react";
import { Activity, User } from "@/types";
import { mockActivities, generateId } from "@/lib/mock-data";
import { useAuth } from "./AuthContext";
import fetchWithAuth from "@/lib/fetchInstance";
import { ToyBrick } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
interface ActivityContextType {
  activities: Activity[];
  logActivity: (
    action: Activity["action"],
    resource: string,
    riskLevel?: Activity["riskLevel"]
  ) => void;
  getUserActivities: (userId?: string) => Activity[];
  getRecentActivities: (count?: number) => Activity[];
  getHighRiskActivities: () => Activity[];
}

const ActivityContext = createContext<ActivityContextType | undefined>(
  undefined
);

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [userAgent, setUserAgent] = useState<string | null>(null);
  const { auth } = useAuth();

  // useEffect(() => {
  //   const fetchActivities = async () => {

  //   }

  //   fetchActivities()
  // }, [])

  useEffect(() => {
    const getAllActivities = async () => {
      const token = sessionStorage.getItem("token");

      if (!token || !auth.user?.id) {
        console.log("Token or user ID not found!");
        return;
      }

      try {
        console.log(
          "Fetching activities with URL:",
          `${API_URL}/activity/getActivities/${auth.user.id}`
        );
        console.log(
          "Using token:",
          token ? `${token.substring(0, 5)}...` : "No token"
        );

        const response = await fetch(
          `${API_URL}/activity/getActivities/${auth.user.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Check if response is OK before parsing JSON
        if (!response.ok) {
          console.error(
            "API response not OK:",
            response.status,
            response.statusText
          );
          return;
        }

        const result = await response.json();

        // Log the entire result for debugging
        console.log("API Response:", JSON.stringify(result, null, 2));

        if (!result.success) {
          console.error(
            "Failed to fetch activities:",
            result.message || "Unknown error"
          );
          console.error("Full response:", result);
          return;
        }

        console.log("Activities fetched:", result);

        // Check if we have an activities property in the result
        if (result.activities) {
          // Handle the case where backend returns { activities: [...] }
          console.log("Activities found in activities property");

          // Map activities from the activities property
          const fetchedActivities = result.activities.map((item) => ({
            id: item?._id || "",
            userId: item?.userId || "",
            action: item?.action || "",
            resource: item?.resource || "",
            timestamp: new Date(item?.updatedAt || new Date().toISOString()),
            userAgent: item?.userAgent || "",
            deviceInfo: item?.deviceInfo || {},
            location: item?.address || "",
            riskLevel: item?.riskLevel || "low",
            details: item?.details || {},
          }));

          setActivities(fetchedActivities);
          return;
        }

        // Add defensive checks
        if (!result.data) {
          console.error("No data property in result:", result);
          return;
        }

        // Check if result.data is an array
        if (Array.isArray(result.data)) {
          // Use optional chaining and nullish coalescing for safety
          const fetchedActivities = result.data.map((item) => ({
            id: item?._id || "",
            userId: item?.userId || "",
            action: item?.action || "",
            resource: item?.resource || "",
            timestamp: new Date(item?.updatedAt || new Date().toISOString()), // Convert string to Date object
            userAgent: item?.userAgent.match(/Chrome\/[\d.]+/)?.[0],
            deviceInfo: item?.deviceInfo || {},
            location: item?.address,
            riskLevel: item?.riskLevel || "low",
            details: item?.details || {},
          }));

          setActivities(fetchedActivities);
        } else {
          console.error(
            "Expected an array of activities but received:",
            result.data
          );
          setActivities([]); // Set to empty array to avoid undefined issues
        }
      } catch (error) {
        // More detailed error logging
        console.error("Error fetching activities:", error);
        if (error instanceof Error) {
          console.error("Error details:", {
            message: error.message,
            stack: error.stack,
          });
        } else {
          console.error("Non-Error object thrown");
        }

        setActivities([]); // Set to empty array in case of error
      }
    };

    getAllActivities();
  }, [auth.user?.id]);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setUserAgent(navigator.userAgent);
    }
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          console.log(
            "Geolocation fetch successfully...",
            position.coords.latitude,
            position.coords.accuracy
          );
        },
        (err) => {
          console.log("error to fetch geolocation", err);
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }, []);

  // Get user's activities
  const getUserActivities = (userId?: string) => {
    const targetUserId = userId || auth.user?.id;
    if (!targetUserId) return [];

    return activities
      .filter((activity) => activity.userId === targetUserId)
      .sort((a, b) => {
        // Safely handle timestamp comparison
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
        return timeB - timeA;
      });
  };

  // Get most recent activities
  const getRecentActivities = (count = 10) => {
    return [...activities]
      .sort((a, b) => {
        // Safely handle timestamp comparison
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, count);
  };

  // Get high risk activities
  const getHighRiskActivities = () => {
    return activities
      .filter((activity) => activity.riskLevel === "high")
      .sort((a, b) => {
        // Safely handle timestamp comparison
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
        return timeB - timeA;
      });
  };

  // Log a new activity
  const logActivity = async (
    action: Activity["action"],
    resource: string,
    riskLevel: Activity["riskLevel"] = "low"
  ) => {
    if (!auth?.user) return;

    const token = sessionStorage.getItem("token");
    if (!token) {
      console.log("token not found at logActivity!");
      return;
    }

    try {
      // Get device info
      // const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      // const deviceInfo = `${isMobile ? 'Mobile' : 'Desktop'} - ${navigator.userAgent.split(' ').pop() || 'Unknown'}`;
      // const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
      // const deviceInfo = userAgent.split(' ').pop() || 'Unknown';

      const response = await fetch(
        `${API_URL}/activity/updateActivities/${auth.user.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: auth.user.id,
            departmentId: auth.user.department_id,
            departmentName: auth.user.departmentName,
            action: action, // upload, delete, update
            resource: resource, // filename.txt
            userAgent: userAgent,
            deviceInfo: userAgent ? userAgent.split(" ").pop() : "Unknown",
            riskLevel: riskLevel,
            latitude: location.latitude,
            longitude: location.longitude,
            details: { fileType: "pdf", fileSize: "2.5MB" }, // we can add many more
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        console.error(
          "Failed to log activity:",
          result.message || "Unknown error"
        );
      } else {
        console.log("Activity logged:", result);
      }

      // const newActivity: Activity = {
      //   id: result.data._id,
      //   userId: result.data.userId,
      //   action: result.data.action,
      //   resource: result.data.resource,
      //   timestamp: result.data.updatedAt,
      //   userAgent: result.data.userAgent,
      //   deviceInfo: result.data.deviceInfo,
      //   location: result.data.address,
      //   riskLevel: result.data.riskLevel,
      //   details: result.data.details
      // };

      // setActivities(prev => [newActivity, ...prev]);
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  return (
    <ActivityContext.Provider
      value={{
        activities,
        logActivity,
        getUserActivities,
        getRecentActivities,
        getHighRiskActivities,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
};
