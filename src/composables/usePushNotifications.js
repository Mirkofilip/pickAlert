import { Capacitor } from "@capacitor/core";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
const KEY = "pickalert_push_city";
export function usePushNotifications() {
  async function subscribeToCity(cityId) {
    if (!Capacitor.isNativePlatform())
      throw new Error(
        "Le notifiche sono disponibili nell’app Android. Qui puoi scegliere la zona e consultare il feed.",
      );
    const permission = await FirebaseMessaging.requestPermissions();
    if (permission.receive !== "granted")
      throw new Error(
        "Consenti le notifiche nelle impostazioni Android per ricevere gli avvisi.",
      );
    await FirebaseMessaging.createChannel({
      id: "pickalert_alerts",
      name: "Avvisi della tua zona",
      importance: 4,
    });
    await FirebaseMessaging.getToken();
    const previous = localStorage.getItem(KEY);
    if (previous && previous !== cityId) {
      await FirebaseMessaging.unsubscribeFromTopic({
        topic: `city_${previous}`,
      });
      localStorage.removeItem(KEY);
    }
    await FirebaseMessaging.subscribeToTopic({ topic: `city_${cityId}` });
    localStorage.setItem(KEY, cityId);
  }
  async function unsubscribe() {
    if (Capacitor.isNativePlatform()) {
      const previous = localStorage.getItem(KEY);
      if (previous)
        await FirebaseMessaging.unsubscribeFromTopic({
          topic: `city_${previous}`,
        });
      await FirebaseMessaging.deleteToken();
    }
    localStorage.removeItem(KEY);
  }
  return { subscribeToCity, unsubscribe };
}
