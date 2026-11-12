#ifndef INKSIGHT_PORTAL_H
#define INKSIGHT_PORTAL_H

#include <Arduino.h>

// Portal state
extern bool portalActive;
extern bool wifiConnected;

// Hotspot name from the chip MAC. Valid before WiFi.mode() is called.
String portalApName();

// Start the captive portal (AP mode + web server)
void startCaptivePortal();

// Process pending portal HTTP/DNS requests (call in loop)
void handlePortalClients();

#endif // INKSIGHT_PORTAL_H
