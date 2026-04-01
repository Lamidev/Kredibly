import { io } from "socket.io-client";

// Use the correct backend URL based on environment
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050";

let socket;

export const initiateSocketConnection = (businessId) => {
	socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true
  });

	console.log(`🔌 Connecting to socket for business: ${businessId}...`);
	
	if (socket && businessId) {
		socket.emit("join_business", businessId);
	}

  return socket;
};

export const disconnectSocket = () => {
	console.log("🔌 Disconnecting socket...");
	if (socket) socket.disconnect();
};

export const listenToEvent = (eventName, callback) => {
	if (!socket) return;
	socket.on(eventName, callback);
};

export const stopListeningToEvent = (eventName) => {
  if (!socket) return;
  socket.off(eventName);
};

export default socket;
