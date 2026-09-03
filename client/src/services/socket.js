import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : "";

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
});

export const connectSocket = (user) => {
  if (!socket.connected && user) {
    socket.connect();
    
    socket.on("connect", () => {
      console.log("🔌 Connected to socket server");
      
      const role = user?.role_id?.role_name?.toUpperCase() || user?.role?.name?.toUpperCase();
      
      if (role === "ADMIN") {
        socket.emit("join-admin-room");
      } else if (role === "SELLER") {
        socket.emit("join-seller-room", user._id);
      }
    });
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log("🔌 Disconnected from socket server");
  }
};

export default socket;
