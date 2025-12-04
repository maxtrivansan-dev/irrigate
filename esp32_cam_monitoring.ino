
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "esp_camera.h"
#include <WebServer.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Supabase configuration
const char* supabaseUrl = "https://nkxvqdrqnzzrisfmyway.supabase.co";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reHZxZHJxbnp6cmlzZm15d2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzgxNDIsImV4cCI6MjA2NzM1NDE0Mn0.j4ZxLCookSbomfPIxMWsUp7BO-98c7AKhOutuk9_j8A";

// Camera configuration
#define CAMERA_MODEL_AI_THINKER
#include "camera_pins.h"

WebServer server(80);

// Camera settings
camera_config_t config;

void setup() {
  Serial.begin(115200);
  
  // Initialize camera
  initCamera();
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("ESP32-CAM IP: ");
  Serial.println(WiFi.localIP());
  
  // Setup web server routes
  setupWebServer();
  
  server.begin();
  Serial.println("Camera server started");
}

void loop() {
  server.handleClient();
  
  // Send periodic status updates
  static unsigned long lastStatusUpdate = 0;
  if (millis() - lastStatusUpdate > 60000) { // Every minute
    sendStatusUpdate();
    lastStatusUpdate = millis();
  }
  
  delay(100);
}

void initCamera() {
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    config.frame_size = FRAMESIZE_UXGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  // Initialize camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  // Set camera settings
  sensor_t * s = esp_camera_sensor_get();
  s->set_brightness(s, 0);
  s->set_contrast(s, 0);
  s->set_saturation(s, 0);
  s->set_special_effect(s, 0);
  s->set_whitebal(s, 1);
  s->set_awb_gain(s, 1);
  s->set_wb_mode(s, 0);
  s->set_exposure_ctrl(s, 1);
  s->set_aec2(s, 0);
  s->set_ae_level(s, 0);
  s->set_aec_value(s, 300);
  s->set_gain_ctrl(s, 1);
  s->set_agc_gain(s, 0);
  s->set_gainceiling(s, (gainceiling_t)0);
  s->set_bpc(s, 0);
  s->set_wpc(s, 1);
  s->set_raw_gma(s, 1);
  s->set_lenc(s, 1);
  s->set_hmirror(s, 0);
  s->set_vflip(s, 0);
  s->set_dcw(s, 1);
  s->set_colorbar(s, 0);
}

void setupWebServer() {
  // Stream endpoint
  server.on("/stream", HTTP_GET, []() {
    server.setContentLength(CONTENT_LENGTH_UNKNOWN);
    server.send(200, "multipart/x-mixed-replace; boundary=frame");
    
    while (true) {
      camera_fb_t * fb = esp_camera_fb_get();
      if (!fb) {
        Serial.println("Camera capture failed");
        break;
      }
      
      server.sendContent("--frame\r\n");
      server.sendContent("Content-Type: image/jpeg\r\n\r\n");
      server.sendContent_P((char*)fb->buf, fb->len);
      server.sendContent("\r\n");
      
      esp_camera_fb_return(fb);
      
      if (!server.client().connected()) {
        break;
      }
      delay(100);
    }
  });

  // Capture single image endpoint
  server.on("/capture", HTTP_GET, []() {
    camera_fb_t * fb = esp_camera_fb_get();
    if (!fb) {
      server.send(500, "text/plain", "Camera capture failed");
      return;
    }
    
    server.sendHeader("Content-Disposition", "inline; filename=capture.jpg");
    server.send_P(200, "image/jpeg", (const char *)fb->buf, fb->len);
    
    esp_camera_fb_return(fb);
  });

  // Status endpoint
  server.on("/status", HTTP_GET, []() {
    DynamicJsonDocument doc(512);
    doc["status"] = "online";
    doc["ip"] = WiFi.localIP().toString();
    doc["free_heap"] = ESP.getFreeHeap();
    doc["uptime"] = millis() / 1000;
    doc["wifi_rssi"] = WiFi.RSSI();
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
  });

  // Settings endpoint
  server.on("/settings", HTTP_POST, []() {
    if (server.hasArg("brightness")) {
      int brightness = server.arg("brightness").toInt();
      sensor_t * s = esp_camera_sensor_get();
      s->set_brightness(s, brightness);
    }
    
    if (server.hasArg("contrast")) {
      int contrast = server.arg("contrast").toInt();
      sensor_t * s = esp_camera_sensor_get();
      s->set_contrast(s, contrast);
    }
    
    server.send(200, "text/plain", "Settings updated");
  });

  // Root endpoint with HTML interface
  server.on("/", HTTP_GET, []() {
    String html = "<!DOCTYPE html><html><head><title>ESP32-CAM</title></head><body>";
    html += "<h1>ESP32-CAM Monitoring</h1>";
    html += "<h2>Live Stream</h2>";
    html += "<img src='/stream' style='width:640px;height:480px;border:1px solid black;'>";
    html += "<h2>Controls</h2>";
    html += "<a href='/capture' target='_blank'><button>Capture Image</button></a>";
    html += "<a href='/status' target='_blank'><button>Status</button></a>";
    html += "</body></html>";
    server.send(200, "text/html", html);
  });
}

void sendStatusUpdate() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  http.begin(String(supabaseUrl) + "/rest/v1/camera_status");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  
  DynamicJsonDocument doc(512);
  doc["camera_id"] = "esp32-cam-01";
  doc["status"] = "online";
  doc["ip_address"] = WiFi.localIP().toString();
  doc["free_heap"] = ESP.getFreeHeap();
  doc["uptime_seconds"] = millis() / 1000;
  doc["wifi_signal"] = WiFi.RSSI();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    Serial.printf("Status update sent: %d\n", httpResponseCode);
  } else {
    Serial.printf("Error sending status: %d\n", httpResponseCode);
  }
  
  http.end();
}
