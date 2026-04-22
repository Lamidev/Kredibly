import { io } from "socket.io-client";

// Strip /api suffix — socket.io needs the root server URL, not the API path
const raw = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
const SOCKET_URL = raw.replace(/\/api\/?$/, "");

let socket;

export const initiateSocketConnection = (businessId, invoiceId) => {
	if (socket && socket.connected) {
		// Already connected — just ensure we're in the right rooms
		if (businessId) socket.emit("join_business", businessId);
		if (invoiceId) socket.emit("join_invoice", String(invoiceId).toLowerCase());
		return socket;
	}

	socket = io(SOCKET_URL, {
		transports: ["websocket", "polling"],
		withCredentials: true
	});

	console.log(`🔌 Connecting to socket for business: ${businessId}, invoice: ${invoiceId}...`);
	
	// 🛡️ Join rooms AFTER connection confirmed (prevents race condition)
	socket.on("connect", () => {
		console.log(`✅ Socket connected. Joining rooms...`);
		if (businessId) socket.emit("join_business", businessId);
		if (invoiceId) socket.emit("join_invoice", String(invoiceId).toLowerCase());
	});

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

export const stopListeningToEvent = (eventName, callback) => {
  if (!socket) return;
  if (callback) {
    socket.off(eventName, callback);
  } else {
    socket.off(eventName);
  }
};

export default socket;
