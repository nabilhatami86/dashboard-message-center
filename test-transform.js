// Quick test for transform function
const sampleAPIResponse = {
  "id": 13,
  "name": "Warung Pak Joko",
  "channel": "WhatsApp",
  "online": true,
  "unread": 2,
  "mode": "bot",
  "profile": {
    "phone": "6285678901234@c.us",
    "email": null,
    "address": null,
    "lastActive": "Online"
  },
  "messages": [
    {
      "id": 67,
      "text": "Pengiriman kemarin telat 3 jam, customer komplain",
      "sender": "customer",
      "status": "sent",
      "time": "18:47",
      "agent_id": null
    }
  ]
};

console.log("Testing transform with actual API response:");
console.log("Name field:", sampleAPIResponse.name);
console.log("Has customer_name?:", sampleAPIResponse.customer_name);
console.log("Profile.phone:", sampleAPIResponse.profile.phone);
console.log("Message time:", sampleAPIResponse.messages[0].time);
console.log("\nExpected frontend Chat object:");
console.log({
  id: sampleAPIResponse.id,
  name: sampleAPIResponse.name,
  channel: sampleAPIResponse.channel,
  online: sampleAPIResponse.online,
  unread: sampleAPIResponse.unread,
  mode: sampleAPIResponse.mode,
  profile: sampleAPIResponse.profile,
  messages: sampleAPIResponse.messages
});
